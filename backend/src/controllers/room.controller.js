const mongoose = require("mongoose");
const roomModel = require("../model/room.model");
const hotelModel = require("../model/hotel.model");
const bookingModel = require("../model/booking.model");


async function createRoom(req, res) {
    try {
        const {
            hotelId,
            name,
            description,
            roomType,
            capacity,
            pricePerNight,
            amenities,
            images,
            totalRooms,
        } = req.body;

        // Required fields
        if (
            !hotelId ||
            !name ||
            !roomType ||
            !capacity ||
            pricePerNight === undefined ||
            !totalRooms
        ) {
            return res.status(400).json({
                message: "Required room details are missing",
            });
        }


        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({
        message: "Invalid hotel ID",
    });
}

        // Check hotel exists
        const hotel = await hotelModel.findById(hotelId);

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        // Only active hotels can receive rooms
        if (hotel.status === "inactive") {
            return res.status(400).json({
                message: "Cannot add room to an inactive hotel",
            });
        }

        // Validate capacity

        // Validate room type
        const allowedRoomTypes = [
            "single",
            "double",
            "deluxe",
            "suite",
            "family",
        ];

        if (!allowedRoomTypes.includes(roomType)) {
            return res.status(400).json({
                message: "Invalid room type",
            });
        }

        // Validate capacity
        const adults = Number(capacity.adults);
        const children = Number(capacity.children);

        if (
            !Number.isInteger(adults) ||
            adults < 1 ||
            adults > 20 ||
            !Number.isInteger(children) ||
            children < 0 ||
            children > 20
        ) {
            return res.status(400).json({
                message: "Invalid room capacity",
            });
        }

        // Validate price
        const price = Number(pricePerNight);

        if (
            !Number.isFinite(price) ||
            price <= 0 ||
            price > 10000000
        ) {
            return res.status(400).json({
                message: "Invalid room price",
            });
        }

        // Validate total rooms
        const roomCount = Number(totalRooms);

        if (
            !Number.isInteger(roomCount) ||
            roomCount < 1 ||
            roomCount > 10000
        ) {
            return res.status(400).json({
                message: "Total rooms must be between 1 and 10000",
            });
        }

   
        const room = await roomModel.create({
            hotel: hotelId,
            name,
            description,
            roomType,
            capacity: { adults, children },
            pricePerNight: price,
            amenities,
            images,
            totalRooms: roomCount,
        });


        return res.status(201).json({
            message: "Room created successfully",
            room,
        });

    } catch (error) {
        console.error("Create room error:", error);

        return res.status(500).json({
            message: "Failed to create room",
        });
    }
}

async function getRoomsByHotel(req, res) {
    try {
        const { hotelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

        const hotel = await hotelModel.findOne({
            _id: hotelId,
            status: "active",
        });

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        const rooms = await roomModel
            .find({
                hotel: hotelId,
                status: "active",
            })
            .select("-__v")
            .sort({ pricePerNight: 1 });

        return res.status(200).json({
            message: "Rooms fetched successfully",
            rooms,
        });

    } catch (error) {
        console.error("Get rooms by hotel error:", error);

        return res.status(500).json({
            message: "Failed to fetch rooms",
        });
    }
}

async function getAdminRooms(req, res) {
    try {
        const rooms = await roomModel
            .find()
            .populate("hotel", "name location.city")
            .select("-__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Rooms fetched successfully",
            rooms,
        });
    } catch (error) {
        console.error("Get admin rooms error:", error);
        return res.status(500).json({
            message: "Failed to fetch rooms",
        });
    }
}

async function updateRoom(req, res) {
    try {
        const { roomId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid room ID" });
        }

        const allowedFields = [
            "name",
            "description",
            "roomType",
            "capacity",
            "pricePerNight",
            "amenities",
            "images",
            "totalRooms",
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided for update",
            });
        }

        if (updates.name !== undefined &&
            (typeof updates.name !== "string" || !updates.name.trim())) {
            return res.status(400).json({ message: "Room name is required" });
        }


        if (updates.roomType !== undefined) {
            const allowedRoomTypes = [
                "single",
                "double",
                "deluxe",
                "suite",
                "family",
            ];

            if (!allowedRoomTypes.includes(updates.roomType)) {
                return res.status(400).json({
                    message: "Invalid room type",
                });
            }
        }

        if (updates.pricePerNight !== undefined) {
            const price = Number(updates.pricePerNight);

            if (
                !Number.isFinite(price) ||
                price <= 0 ||
                price > 10000000
            ) {
                return res.status(400).json({
                    message: "Invalid room price",
                });
            }

            updates.pricePerNight = price;
        }

  if (updates.totalRooms !== undefined) {
    const roomCount = Number(updates.totalRooms);

    if (
        !Number.isInteger(roomCount) ||
        roomCount < 1 ||
        roomCount > 10000
    ) {
        return res.status(400).json({
            message: "Total rooms must be between 1 and 10000",
        });
    }

    // Prevent reducing room inventory below existing reservations.
    const now = new Date();

    const activeBookings = await bookingModel.find({
        room: roomId,
        checkOut: { $gt: now },
        $or: [
            { status: "confirmed" },
            {
                status: "pending",
                paymentExpiresAt: { $gt: now },
            },
        ],
    })
        .select("checkIn checkOut roomsBooked")
        .lean();

    // Calculate the maximum number of rooms booked simultaneously.
    const events = [];

    for (const booking of activeBookings) {
        events.push({
            date: new Date(booking.checkIn).getTime(),
            change: booking.roomsBooked,
        });

        events.push({
            date: new Date(booking.checkOut).getTime(),
            change: -booking.roomsBooked,
        });
    }

    events.sort((a, b) => a.date - b.date || a.change - b.change);

    let currentlyBooked = 0;
    let maxBooked = 0;

    for (const event of events) {
        currentlyBooked += event.change;
        maxBooked = Math.max(maxBooked, currentlyBooked);
    }

    if (roomCount < maxBooked) {
        return res.status(409).json({
            message: `Cannot reduce total rooms below ${maxBooked}. Existing bookings require this inventory.`,
        });
    }

    updates.totalRooms = roomCount;
}

        if (updates.capacity !== undefined) {
            const { adults, children } = updates.capacity;

            if (
                !Number.isInteger(adults) ||
                adults < 1 ||
                adults > 20 ||
                !Number.isInteger(children) ||
                children < 0 ||
                children > 20
            ) {
                return res.status(400).json({
                    message: "Invalid room capacity",
                });
            }
        }


        if (updates.name !== undefined) {
            updates.name = updates.name.trim();
        }

        
        if (
            updates.description !== undefined &&
            (typeof updates.description !== "string" ||
                updates.description.length > 1000)
        ) {
            return res.status(400).json({
                message: "Description must be text and at most 1000 characters",
            });
        }

        if (updates.amenities !== undefined) {
            if (
                !Array.isArray(updates.amenities) ||
                updates.amenities.length > 50 ||
                updates.amenities.some(
                    (item) =>
                        typeof item !== "string" ||
                        item.trim().length === 0 ||
                        item.trim().length > 100
                )
            ) {
                return res.status(400).json({
                    message: "Invalid room amenities",
                });
            }

            updates.amenities = updates.amenities.map((item) => item.trim());
        }

        if (updates.images !== undefined) {
            if (
                !Array.isArray(updates.images) ||
                updates.images.length > 20 ||
                updates.images.some(
                    (item) =>
                        typeof item !== "string" ||
                        item.length > 2048 ||
                        !/^https?:\/\/\S+$/i.test(item)
                )
            ) {
                return res.status(400).json({
                    message: "Room images must be valid HTTP or HTTPS URLs",
                });
            }
        }

const session = await mongoose.startSession();
let updatedRoom;

try {
    await session.withTransaction(async () => {
        // Lock the room document so concurrent booking operations
        // conflict with this inventory update.
        const roomLock = await roomModel.updateOne(
            { _id: roomId },
            { $inc: { reservationVersion: 1 } },
            { session }
        );

        if (roomLock.matchedCount !== 1) {
            const error = new Error("ROOM_NOT_FOUND");
            throw error;
        }

        // Recheck bookings inside the same transaction.
        if (updates.totalRooms !== undefined) {
            const now = new Date();

            const activeBookings = await bookingModel.find({
                room: roomId,
                checkOut: { $gt: now },
                $or: [
                    { status: "confirmed" },
                    {
                        status: "pending",
                        paymentExpiresAt: { $gt: now },
                    },
                ],
            })
                .select("checkIn checkOut roomsBooked")
                .session(session)
                .lean();

            const events = [];

            for (const booking of activeBookings) {
                events.push({
                    date: new Date(booking.checkIn).getTime(),
                    change: booking.roomsBooked,
                });

                events.push({
                    date: new Date(booking.checkOut).getTime(),
                    change: -booking.roomsBooked,
                });
            }

            events.sort(
                (a, b) => a.date - b.date || a.change - b.change
            );

            let currentlyBooked = 0;
            let maxBooked = 0;

            for (const event of events) {
                currentlyBooked += event.change;
                maxBooked = Math.max(maxBooked, currentlyBooked);
            }

            if (updates.totalRooms < maxBooked) {
                const error = new Error("ROOM_INVENTORY_CONFLICT");
                error.maxBooked = maxBooked;
                throw error;
            }
        }

        updatedRoom = await roomModel.findByIdAndUpdate(
            roomId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
                session,
            }
        );

        if (!updatedRoom) {
            const error = new Error("ROOM_NOT_FOUND");
            throw error;
        }
    });
} catch (error) {
    if (error.message === "ROOM_INVENTORY_CONFLICT") {
        return res.status(409).json({
            message: `Cannot reduce total rooms below ${error.maxBooked}. Existing bookings require this inventory.`,
        });
    }

    if (error.message === "ROOM_NOT_FOUND") {
        return res.status(404).json({
            message: "Room not found",
        });
    }

    throw error;
} finally {
    await session.endSession();
}

const room = updatedRoom;

        return res.status(200).json({
            message: "Room updated successfully",
            room,
        });
    } catch (error) {
        console.error("Update room error:", error);
        return res.status(500).json({ message: "Failed to update room" });
    }
}

async function updateRoomStatus(req, res) {
    try {
        const { roomId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid room ID" });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "Status must be active or inactive",
            });
        }

        const room = await roomModel.findByIdAndUpdate(
            roomId,
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        return res.status(200).json({
            message: `Room ${status === "active" ? "activated" : "deactivated"} successfully`,
            room,
        });
    } catch (error) {
        console.error("Update room status error:", error);
        return res.status(500).json({
            message: "Failed to update room status",
        });
    }
}

module.exports = {
    createRoom,
    getRoomsByHotel,
    getAdminRooms,
    updateRoom,
    updateRoomStatus
};