const express = require("express");

const { createHotel,getHotels,getAdminHotels,updateHotelImages,updateHotelStatus,getHotelById,deleteHotel, updateHotelExperience} = require("../controllers/hotel.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getHotels);
router.get( "/admin/all", authMiddleware, requireAdmin, getAdminHotels);
router.get("/:hotelId",authMiddleware,getHotelById);
router.post( "/",authMiddleware,requireAdmin, createHotel);
router.patch("/:hotelId/status",authMiddleware,requireAdmin,updateHotelStatus);
router.patch("/:hotelId/images",authMiddleware,requireAdmin,updateHotelImages);
router.delete("/:hotelId", authMiddleware, requireAdmin, deleteHotel);
router.patch("/:hotelId/experience",authMiddleware,requireAdmin,updateHotelExperience);

module.exports = router;