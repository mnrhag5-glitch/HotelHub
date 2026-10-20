require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const userModel = require("./src/model/user.model");

const app = require("./src/app");
app.set("trust proxy", 1);
const connectDb = require("./src/database/db");
const { startBookingExpiryJob } = require("./src/services/booking-expiry.service");

const PORT = process.env.PORT || 3000;

// 1. HTTP server create karo
const server = http.createServer(app);

// 2. Socket.IO initialize karo
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

// 3. YAHAN socket authentication code add karo
io.use(async (socket, next) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie || "";

        const tokenCookie = cookieHeader
            .split("; ")
            .find((cookie) => cookie.startsWith("token="));

        if (!tokenCookie) {
            return next(new Error("Authentication required"));
        }

        const token = decodeURIComponent(tokenCookie.slice(6));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel
            .findById(decoded.user_id)
            .select("_id role isVerified");

        if (!user) {
            return next(new Error("User not found"));
        }

        socket.user = {
            user_id: user._id.toString(),
            role: user.role,
            isVerified: user.isVerified,
        };

        next();
    } catch (error) {
        next(new Error("Socket authentication failed"));
    }
});

// 4. Existing server startup
async function startServer() {
    try {
        await connectDb();

        server.listen(PORT, () => {
            console.log(`HotelHub server running on port ${PORT}`);
        });

        startBookingExpiryJob();
    } catch (error) {
        console.log("Server startup failed");
        process.exit(1);
    }
}
const { registerChatSocket } = require("./src/services/chat-socket.service");

registerChatSocket(io);

startServer();