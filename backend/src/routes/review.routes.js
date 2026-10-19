const express = require("express");

const {
    getHotelReviews,
    upsertHotelReview,
    getAdminHotelReviews,
    deleteReviewByAdmin,
    getAllAdminReviews,
} = require("../controllers/review.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");

const router = express.Router();

// Public: kisi hotel ke reviews dekhna
router.get("/hotel/:hotelId", getHotelReviews);

// Admin: kisi hotel ke saare reviews dekhna
router.get(
    "/admin/hotel/:hotelId",
    authMiddleware,
    requireAdmin,
    getAdminHotelReviews
);

// Logged-in user: review submit ya update karna
router.post(
    "/hotel/:hotelId",
    authMiddleware,
    upsertHotelReview
);

router.delete(
  "/admin/:reviewId",
  authMiddleware,
  requireAdmin,
  deleteReviewByAdmin
);

// Admin: sabhi hotels ke reviews dekhna

router.get(
    "/admin/all",
    authMiddleware,
    requireAdmin,
    getAllAdminReviews
);


module.exports = router;