const express = require("express");

const {
    createRoom,
    getRoomsByHotel,
    getAdminRooms,
    updateRoom,
    updateRoomStatus,
} = require("../controllers/room.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");

const router = express.Router();

// Public-facing room data requires an authenticated user, as before.
router.get("/hotel/:hotelId", authMiddleware, getRoomsByHotel);

// Admin-only room management.
router.get("/admin/all", authMiddleware, requireAdmin, getAdminRooms);
router.post("/", authMiddleware, requireAdmin, createRoom);
router.patch("/:roomId", authMiddleware, requireAdmin, updateRoom);
router.patch("/:roomId/status", authMiddleware, requireAdmin, updateRoomStatus);

module.exports = router;