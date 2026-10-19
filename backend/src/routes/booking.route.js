const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const { adminMiddleware } = require("../middleware/admin.middleware");

const {
  checkRoomAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  updateBookingStatus,
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/availability", checkRoomAvailability);
router.post("/", authMiddleware, createBooking);
router.get("/my-bookings", authMiddleware, getMyBookings);

router.get( "/admin/all", authMiddleware, adminMiddleware, getAllBookings);

router.patch("/:bookingId/cancel", authMiddleware, cancelBooking);
router.patch( "/admin/:bookingId/status", authMiddleware, adminMiddleware, updateBookingStatus);
module.exports = router;