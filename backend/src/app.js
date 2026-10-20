const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const hotelRoutes = require("./routes/hotel.route");
const userRoutes = require("./routes/user.route");
const roomRoutes = require("./routes/room.route");
const bookingRoutes = require("./routes/booking.route");
const paymentRoutes = require("./routes/payment.route");
const authRoutes = require("./routes/auth.route");
const reviewRoutes = require("./routes/review.routes");


const app = express();
app.use(helmet());



const allowedOrigins = [
    "http://localhost:5173",
    "https://hotelhub-rouge.vercel.app",
    "https://hotelhub-2pstcotcu-mnrhag5-glitch.vercel.app",
    "https://hotel-hub-gray.vercel.app"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));



app.use( "/api/payments/webhook",express.raw({ type: "application/json" }));


app.use(express.json());
app.use(cookieParser());



app.get("/", (req, res) => {
    res.json({
        message: "HotelHub API is running"
    });
});


app.use("/api/users", userRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);

module.exports = app;