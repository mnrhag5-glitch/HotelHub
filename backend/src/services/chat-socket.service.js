const mongoose = require("mongoose");
const ChatMessage = require("../model/chatMessage.model");
const chatConversationModel = require("../model/chatConversation.model");
const chatMessageModel = require("../model/chatMessage.model");
const hotelModel = require("../model/hotel.model");

const MAX_MESSAGE_LENGTH = 2000;
const MESSAGE_HISTORY_LIMIT = 50;
const MESSAGE_RATE_LIMIT = 10;
const MESSAGE_RATE_WINDOW_MS = 10_000;

function registerChatSocket(io) {
    const messageAttempts = new Map();

    async function getAuthorizedConversation(socket, conversationId) {
        if (
            typeof conversationId !== "string" ||
            !mongoose.isValidObjectId(conversationId)
        ) {
            return null;
        }

        const conversation = await chatConversationModel.findById(
            conversationId
        );

        if (!conversation) return null;

        const isCustomer =
            conversation.customer.toString() === socket.user.user_id;

        const isAdmin = socket.user.role === "admin";

        if (!isCustomer && !isAdmin) return null;

        return conversation;
    }

    async function getUnreadCustomerMessageCount() {
        const result = await chatMessageModel.aggregate([
            { $match: { readAt: null } },
            {
                $lookup: {
                    from: chatConversationModel.collection.name,
                    localField: "conversation",
                    foreignField: "_id",
                    as: "conversationDoc",
                },
            },
            { $unwind: "$conversationDoc" },
            {
                $match: {
                    $expr: {
                        $eq: ["$sender", "$conversationDoc.customer"],
                    },
                },
            },
            { $count: "unreadCount" },
        ]);

        return result[0]?.unreadCount || 0;
    }

    async function getUnreadHotelMessageCount(customerId, hotelId) {
        const conversation = await chatConversationModel.findOne({
            customer: customerId,
            hotel: hotelId,
        }).select("_id");

        if (!conversation) return 0;

        return chatMessageModel.countDocuments({
            conversation: conversation._id,
            readAt: null,
            sender: { $ne: customerId },
        });
    }

    async function broadcastUnreadCount() {
        const unreadCount = await getUnreadCustomerMessageCount();

        io.to("admins").emit("chat:admin:unread-count-updated", {
            unreadCount,
        });

        return unreadCount;
    }

    io.on("connection", (socket) => {
        console.log(`Chat connected: ${socket.user.user_id}`);

        if (socket.user.role === "admin") {
            socket.join("admins");
        }

        // Customer ke Contact Hotel badge ko chat band hone par bhi update karne ke liye.
        if (socket.user.role !== "admin") {
            socket.join(`customer:${socket.user.user_id}`);
        }

        // Customer is hotel ke unread messages ka count maangta hai.
        socket.on("chat:customer:unread-count", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                if (socket.user.role === "admin") {
                    return callback({ success: false, unreadCount: 0 });
                }

                const { hotelId } = payload || {};

                if (
                    typeof hotelId !== "string" ||
                    !mongoose.isValidObjectId(hotelId)
                ) {
                    return callback({ success: false, unreadCount: 0 });
                }

                const unreadCount = await getUnreadHotelMessageCount(
                    socket.user.user_id,
                    hotelId
                );

                return callback({ success: true, unreadCount });
            } catch (error) {
                console.error("Customer unread count error:", error.message);

                return callback({
                    success: false,
                    unreadCount: 0,
                });
            }
        });

        // Admin dashboard ka unread messages count.
        socket.on("chat:admin:unread-count", async (_payload, callback) => {
            if (typeof callback !== "function") return;

            if (socket.user.role !== "admin") {
                return callback({
                    success: false,
                    message: "Admin access required",
                });
            }

            try {
                const unreadCount = await getUnreadCustomerMessageCount();

                return callback({
                    success: true,
                    unreadCount,
                });
            } catch (error) {
                console.error("Unread chat count error:", error.message);

                return callback({
                    success: false,
                    message: "Unable to load unread count",
                });
            }
        });

        // Customer hotel-specific conversation open karta hai.
        socket.on("chat:join", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                const { hotelId } = payload || {};

                if (
                    typeof hotelId !== "string" ||
                    !mongoose.isValidObjectId(hotelId)
                ) {
                    return callback({
                        success: false,
                        message: "Valid hotel ID is required",
                    });
                }

                if (
                    socket.user.role !== "admin" &&
                    !socket.user.isVerified
                ) {
                    return callback({
                        success: false,
                        message: "Please verify your account first",
                    });
                }

                const hotel = await hotelModel
                    .findById(hotelId)
                    .select("_id");

                if (!hotel) {
                    return callback({
                        success: false,
                        message: "Hotel not found",
                    });
                }

                if (socket.user.role === "admin") {
                    return callback({
                        success: false,
                        message:
                            "Admin must select a conversation from the inbox",
                    });
                }

                let conversation;

                try {
                    conversation =
                        await chatConversationModel.findOneAndUpdate(
                            {
                                hotel: hotel._id,
                                customer: socket.user.user_id,
                            },
                            {
                                $setOnInsert: {
                                    hotel: hotel._id,
                                    customer: socket.user.user_id,
                                    status: "open",
                                    lastMessageAt: new Date(),
                                },
                            },
                            {
                                returnDocument: "after",
                                upsert: true,
                                runValidators: true,
                            }
                        );
                } catch (error) {
                    if (error.code !== 11000) throw error;

                    conversation = await chatConversationModel.findOne({
                        hotel: hotel._id,
                        customer: socket.user.user_id,
                    });
                }

                if (!conversation) {
                    return callback({
                        success: false,
                        message: "Unable to open conversation",
                    });
                }

                if (conversation.status === "closed") {
                    return callback({
                        success: false,
                        message: "This conversation is closed",
                    });
                }

                await socket.join(
                    `conversation:${conversation._id.toString()}`
                );

                const messages = await chatMessageModel
                    .find({ conversation: conversation._id })
                    .sort({ createdAt: -1, _id: -1 })
                    .limit(MESSAGE_HISTORY_LIMIT)
                    .lean();

                messages.reverse();

                await chatMessageModel.updateMany(
                    {
                        conversation: conversation._id,
                        sender: { $ne: socket.user.user_id },
                        readAt: null,
                    },
                    { $set: { readAt: new Date() } }
                );

                // Read status update hone ke baad latest messages dobara fetch karo.
                const updatedMessages = await chatMessageModel
                    .find({ conversation: conversation._id })
                    .sort({ createdAt: -1, _id: -1 })
                    .limit(MESSAGE_HISTORY_LIMIT)
                    .lean();

                updatedMessages.reverse();

                const unreadCount = await getUnreadHotelMessageCount(
                    socket.user.user_id,
                    hotel._id.toString()
                );

                socket.emit("chat:customer:unread-count-updated", {
                    hotelId: hotel._id.toString(),
                    unreadCount,
                });

                return callback({
                    success: true,
                    conversation: {
                        id: conversation._id.toString(),
                        hotelId: conversation.hotel.toString(),
                        customerId: conversation.customer.toString(),
                        status: conversation.status,
                    },
                    messages: updatedMessages,
                });
            } catch (error) {
                console.error("Chat join error:", error.message);

                return callback({
                    success: false,
                    message: "Unable to open chat",
                });
            }
        });
                // Admin inbox: conversations ki list.
        socket.on("chat:admin:list", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                if (socket.user.role !== "admin") {
                    return callback({
                        success: false,
                        message: "Admin access required",
                    });
                }

                const page = Math.max(
                    1,
                    Math.min(10000, Number(payload?.page) || 1)
                );

                const limit = Math.min(
                    50,
                    Math.max(1, Number(payload?.limit) || 20)
                );

                const conversations = await chatConversationModel
                    .find({})
                    .populate("hotel", "name")
                    .populate("customer", "name email")
                    .sort({ lastMessageAt: -1, _id: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean();

                return callback({
                    success: true,
                    conversations,
                    page,
                    limit,
                });
            } catch (error) {
                console.error("Admin chat list error:", error.message);

                return callback({
                    success: false,
                    message: "Unable to load conversations",
                });
            }
        });

        // Existing conversation join karna aur messages load karna.
        socket.on("chat:join-conversation", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                const conversation = await getAuthorizedConversation(
                    socket,
                    payload?.conversationId
                );

                if (!conversation) {
                    return callback({
                        success: false,
                        message: "Conversation not found or access denied",
                    });
                }

                if (conversation.status === "closed") {
                    return callback({
                        success: false,
                        message: "This conversation is closed",
                    });
                }

                await socket.join(
                    `conversation:${conversation._id.toString()}`
                );

                // Admin conversation open kare to customer messages read mark karo.
                if (socket.user.role === "admin") {
                    await chatMessageModel.updateMany(
                        {
                            conversation: conversation._id,
                            sender: conversation.customer,
                            readAt: null,
                        },
                        {
                            $set: { readAt: new Date() },
                        }
                    );

                    await broadcastUnreadCount();
                }

                const messages = await ChatMessage.find({
                    conversation: conversation._id,
                })
                    .sort({ createdAt: 1 })
                    .limit(100)
                    .populate("sender", "name email role")
                    .lean();

                return callback({
                    success: true,
                    conversation: {
                        id: conversation._id.toString(),
                        hotelId: conversation.hotel.toString(),
                        customerId: conversation.customer.toString(),
                        status: conversation.status,
                    },
                    messages,
                });
            } catch (error) {
                console.error("Conversation join error:", error);

                return callback({
                    success: false,
                    message: "Unable to load conversation history",
                });
            }
        });

        // Paginated message history.
        socket.on("chat:history", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                const conversation = await getAuthorizedConversation(
                    socket,
                    payload?.conversationId
                );

                if (!conversation) {
                    return callback({
                        success: false,
                        message: "Conversation not found or access denied",
                    });
                }

                const page = Math.max(
                    1,
                    Math.min(10000, Number(payload?.page) || 1)
                );

                const limit = Math.min(
                    50,
                    Math.max(1, Number(payload?.limit) || 50)
                );

                const messages = await chatMessageModel
                    .find({ conversation: conversation._id })
                    .sort({ createdAt: -1, _id: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean();

                messages.reverse();

                return callback({
                    success: true,
                    messages,
                    page,
                    limit,
                });
            } catch (error) {
                console.error("Chat history error:", error.message);

                return callback({
                    success: false,
                    message: "Unable to load message history",
                });
            }
        });

        // Authorized conversation mein message send karna.
        socket.on("chat:send", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                const now = Date.now();
                const userId = socket.user.user_id;
                const previous = messageAttempts.get(userId) || [];

                const recent = previous.filter(
                    (time) => now - time < MESSAGE_RATE_WINDOW_MS
                );

                if (recent.length >= MESSAGE_RATE_LIMIT) {
                    messageAttempts.set(userId, recent);

                    return callback({
                        success: false,
                        message:
                            "Too many messages. Please wait a moment.",
                    });
                }

                if (typeof payload?.message !== "string") {
                    return callback({
                        success: false,
                        message: "Message must be text",
                    });
                }

                const message = payload.message.trim();

                if (
                    message.length === 0 ||
                    message.length > MAX_MESSAGE_LENGTH
                ) {
                    return callback({
                        success: false,
                        message: "Message must contain 1–2000 characters",
                    });
                }

                const conversation = await getAuthorizedConversation(
                    socket,
                    payload?.conversationId
                );

                if (!conversation) {
                    return callback({
                        success: false,
                        message: "Conversation not found or access denied",
                    });
                }

                if (conversation.status !== "open") {
                    return callback({
                        success: false,
                        message: "This conversation is closed",
                    });
                }

                if (
                    socket.user.role !== "admin" &&
                    !socket.user.isVerified
                ) {
                    return callback({
                        success: false,
                        message: "Please verify your account first",
                    });
                }

                recent.push(now);
                messageAttempts.set(userId, recent);

                const savedMessage = await chatMessageModel.create({
                    conversation: conversation._id,
                    sender: userId,
                    message,
                });

                conversation.lastMessage = message;
                conversation.lastMessageAt = savedMessage.createdAt;

                await conversation.save();

                const room =
                    `conversation:${conversation._id.toString()}`;

                const messagePayload = {
                    _id: savedMessage._id.toString(),
                    conversation: conversation._id.toString(),
                    sender: userId,
                    senderRole: socket.user.role,
                    message: savedMessage.message,
                    readAt: savedMessage.readAt,
                    createdAt: savedMessage.createdAt,
                };

                // Conversation open rakhne wale sockets ko message bhejo.
                io.to(room).emit("chat:new-message", messagePayload);

                if (socket.user.role !== "admin") {
                    // Admin dashboard par real-time notification bhejo.
                    io.to("admins").emit(
                        "chat:admin:new-message",
                        messagePayload
                    );

                    await broadcastUnreadCount();
                } else {
                    // Admin reply aate hi customer ka Contact Hotel badge update karo.
                    const unreadCount = await getUnreadHotelMessageCount(
                        conversation.customer.toString(),
                        conversation.hotel.toString()
                    );

                    io.to(
                        `customer:${conversation.customer.toString()}`
                    ).emit("chat:customer:unread-count-updated", {
                        hotelId: conversation.hotel.toString(),
                        unreadCount,
                    });
                }

                return callback({
                    success: true,
                    message: {
                        _id: savedMessage._id.toString(),
                        conversation: conversation._id.toString(),
                        sender: userId,
                        message: savedMessage.message,
                        createdAt: savedMessage.createdAt,
                    },
                });
            } catch (error) {
                console.error("Chat send error:", error.message);

                return callback({
                    success: false,
                    message: "Unable to send message",
                });
            }
        });        // Delete a chat message.
        socket.on("chat:delete-message", async (payload, callback) => {
            if (typeof callback !== "function") return;

            try {
                const { conversationId, messageId } = payload || {};

                if (
                    typeof conversationId !== "string" ||
                    typeof messageId !== "string" ||
                    !mongoose.isValidObjectId(conversationId) ||
                    !mongoose.isValidObjectId(messageId)
                ) {
                    return callback({
                        success: false,
                        message: "Invalid conversation or message ID",
                    });
                }

                // Verify conversation access.
                const conversation = await getAuthorizedConversation(
                    socket,
                    conversationId
                );

                if (!conversation) {
                    return callback({
                        success: false,
                        message: "Conversation not found or access denied",
                    });
                }

                // Find the message inside this conversation only.
                const chatMessage = await chatMessageModel.findOne({
                    _id: messageId,
                    conversation: conversation._id,
                });

                if (!chatMessage) {
                    return callback({
                        success: false,
                        message: "Message not found",
                    });
                }

                // Only an admin or the original sender can delete.
                const isAdmin = socket.user.role === "admin";
                const isSender =
                    chatMessage.sender.toString() === socket.user.user_id;

                if (!isAdmin && !isSender) {
                    return callback({
                        success: false,
                        message: "You cannot delete this message",
                    });
                }

                await chatMessageModel.deleteOne({
                    _id: chatMessage._id,
                    conversation: conversation._id,
                });

                const deletedPayload = {
                    messageId: chatMessage._id.toString(),
                    conversationId: conversation._id.toString(),
                };

                // Update all connected clients in this conversation.
                io.to(`conversation:${conversation._id.toString()}`).emit(
                    "chat:message-deleted",
                    deletedPayload
                );

                return callback({
                    success: true,
                    message: "Message deleted successfully",
                    ...deletedPayload,
                });
            } catch (error) {
                console.error("Delete chat message error:", error);

                return callback({
                    success: false,
                    message: "Unable to delete message",
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Chat disconnected: ${socket.user.user_id}`);
        });
    });

    // In-process rate-limit cleanup.
    setInterval(() => {
        const cutoff = Date.now() - MESSAGE_RATE_WINDOW_MS;

        for (const [userId, attempts] of messageAttempts.entries()) {
            const recent = attempts.filter(
                (time) => time >= cutoff
            );

            if (recent.length) {
                messageAttempts.set(userId, recent);
            } else {
                messageAttempts.delete(userId);
            }
        }
    }, MESSAGE_RATE_WINDOW_MS).unref();
}

module.exports = { registerChatSocket };