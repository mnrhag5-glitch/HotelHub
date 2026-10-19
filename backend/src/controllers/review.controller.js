const mongoose = require("mongoose");
const Review = require("../model/review.model");
const hotelModel = require("../model/hotel.model");

async function updateHotelRating(hotelId) {
    const result = await Review.aggregate([
        {
            $match: {
                hotel: new mongoose.Types.ObjectId(hotelId),
            },
        },
        {
            $group: {
                _id: "$hotel",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    const rating = result.length
        ? Math.round(result[0].averageRating * 10) / 10
        : 0;

    const totalReviews = result.length
        ? result[0].totalReviews
        : 0;

    await hotelModel.findByIdAndUpdate(hotelId, {
        $set: {
            rating,
            totalReviews,
        },
    });
}

// Public: hotel ke reviews fetch karna
async function getHotelReviews(req, res) {
    try {
        const { hotelId } = req.params;
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
        );

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

        const hotel = await hotelModel.findOne({
            _id: hotelId,
            status: "active",
        }).select("_id");

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        const [reviews, totalReviews] = await Promise.all([
            Review.find({ hotel: hotelId })
                .populate("user", "name")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Review.countDocuments({ hotel: hotelId }),
        ]);

        return res.status(200).json({
            message: "Reviews fetched successfully",
            reviews,
            pagination: {
                page,
                limit,
                totalReviews,
                totalPages: Math.ceil(totalReviews / limit),
            },
        });
    } catch (error) {
        console.error("Get hotel reviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch reviews",
        });
    }
}

// Logged-in user: review create ya update
async function upsertHotelReview(req, res) {
    try {
        const { hotelId } = req.params;
        const { rating, comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be a whole number from 1 to 5",
            });
        }

        if (
            typeof comment !== "string" ||
            comment.trim().length < 5 ||
            comment.trim().length > 2000
        ) {
            return res.status(400).json({
                message: "Feedback must be between 5 and 2000 characters",
            });
        }

        const hotel = await hotelModel.findOne({
            _id: hotelId,
            status: "active",
        }).select("_id");

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        const userId = req.user.user_id;

        const review = await Review.findOneAndUpdate(
            {
                hotel: hotelId,
                user: userId,
            },
            {
                $set: {
                    rating,
                    comment: comment.trim(),
                },
                $setOnInsert: {
                    hotel: hotelId,
                    user: userId,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        await updateHotelRating(hotelId);

        return res.status(200).json({
            message: "Review saved successfully",
            review,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already reviewed this hotel. Please try again.",
            });
        }

        console.error("Save hotel review error:", error);

        return res.status(500).json({
            message: "Failed to save review",
        });
    }
}

// Admin: hotel ke saare reviews dekhna
async function getAdminHotelReviews(req, res) {
    try {
        const { hotelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

        const hotel = await hotelModel.findById(hotelId)
            .select("name rating totalReviews");

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        const reviews = await Review.find({ hotel: hotelId })
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "Admin reviews fetched successfully",
            hotel,
            reviews,
        });
    } catch (error) {
        console.error("Get admin hotel reviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch hotel reviews",
        });
    }
}


async function deleteReviewByAdmin(req, res) {
    try {
        const { reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID",
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
            });
        }

        const hotelId = review.hotel.toString();

        await Review.deleteOne({ _id: review._id });

        await updateHotelRating(hotelId);

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            reviewId: review._id.toString(),
        });
    } catch (error) {
        console.error("Admin delete review error:", error);

        return res.status(500).json({
            message: "Unable to delete review",
        });
    }
}



async function getAllAdminReviews(req, res) {
    try {
        const reviews = await Review.find({})
            .populate("user", "name email")
            .populate("hotel", "name")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "All reviews fetched successfully",
            reviews,
        });
    } catch (error) {
        console.error("Get all admin reviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch all reviews",
        });
    }
}


module.exports = {
    getHotelReviews,
    upsertHotelReview,
    getAdminHotelReviews,
    getAllAdminReviews,
    deleteReviewByAdmin,
};