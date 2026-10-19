const mongoose = require("mongoose");
const hotelModel = require("../model/hotel.model");
const roomModel = require("../model/room.model");
const bookingModel = require("../model/booking.model");


async function createHotel(req, res) {
    try {
        const {
            name,
            description,
            location,
            contact,
            amenities,
            images,
        } = req.body;

        // Required fields
        if (!name || !description || !location) {
            return res.status(400).json({
                message: "Name, description and location are required",
            });
        }

        // Location validation
        if (
            !location.address ||
            !location.city ||
            !location.state ||
            !location.country
        ) {
            return res.status(400).json({
                message: "Complete hotel location is required",
            });
        }

        // Coordinates validation
        if (
            !location.coordinates ||
            location.coordinates.type !== "Point" ||
            !Array.isArray(location.coordinates.coordinates) ||
            location.coordinates.coordinates.length !== 2
        ) {
            return res.status(400).json({
                message: "Valid hotel coordinates are required",
            });
        }

        const [longitude, latitude] =
            location.coordinates.coordinates;

        if (
            longitude < -180 ||
            longitude > 180 ||
            latitude < -90 ||
            latitude > 90
        ) {
            return res.status(400).json({
                message: "Invalid hotel coordinates",
            });
        }

        // Create hotel
        const hotel = await hotelModel.create({
            name,
            description,
            location,
            contact,
            amenities,
            images,
            owner: req.user.user_id,
        });

        return res.status(201).json({
            message: "Hotel created successfully",
            hotel,
        });

    } catch (error) {
        console.error("Create hotel error:", error);

        return res.status(500).json({
            message: "Failed to create hotel",
        });
    }
}


async function getHotels(req, res) {
    try {
        const hotels = await hotelModel
            .find({ status: "active" })
            .select("-__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Hotels fetched successfully",
            hotels,
        });

    } catch (error) {
        console.error("Get hotels error:", error);

        return res.status(500).json({
            message: "Failed to fetch hotels",
        });
    }
}


async function getAdminHotels(req, res) {
    try {
        const hotels = await hotelModel
            .find({})
            .select("-__v")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            message: "Admin hotels fetched successfully",
            hotels,
        });
    } catch (error) {
        console.error("Get admin hotels error:", error);

        return res.status(500).json({
            message: "Failed to fetch admin hotels",
        });
    }
}



async function updateHotelStatus(req, res) {
    try {
        const { hotelId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "Invalid hotel status",
            });
        }

        const hotel = await hotelModel.findById(hotelId);

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        hotel.status = status;

        await hotel.save();

        return res.status(200).json({
            message: "Hotel status updated successfully",
            hotel,
        });

    } catch (error) {
        console.error("Update hotel status error:", error);

        return res.status(500).json({
            message: "Failed to update hotel status",
        });
    }
}



async function updateHotelImages(req, res) {
    try {
        const { hotelId } = req.params;
        const { images } = req.body;

        if (
            !Array.isArray(images) ||
            images.length === 0 ||
            images.some(
                (image) =>
                    typeof image !== "string" ||
                    image.trim() === "" ||
                    image.length > 2048
            )
        ) {
            return res.status(400).json({
                message: "At least one valid image URL is required",
            });
        }

        const invalidUrl = images.some((image) => {
            try {
                const url = new URL(image.trim());
                return url.protocol !== "https:";
            } catch {
                return true;
            }
        });

        if (invalidUrl) {
            return res.status(400).json({
                message: "All image URLs must be valid HTTPS URLs",
            });
        }

        const hotel = await hotelModel.findByIdAndUpdate(
            hotelId,
            {
                $set: {
                    images: images.map((image) => image.trim()),
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        return res.status(200).json({
            message: "Hotel images updated successfully",
            hotel,
        });
    } catch (error) {
        console.error("Update hotel images error:", error);

        return res.status(500).json({
            message: "Failed to update hotel images",
        });
    }
}


async function updateHotelExperience(req, res) {
    try {
        const { hotelId } = req.params;
        const { experience } = req.body;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

   
const allowedFields = [
    "foodAndDining",
    "staffAndHospitality",
    "viewsAndSurroundings",
    "bedrooms",
];


        if (
            !experience ||
            typeof experience !== "object" ||
            Array.isArray(experience) ||
            Object.keys(experience).length === 0 ||
            Object.keys(experience).some(
                (key) => !allowedFields.includes(key)
            )
        ) {
            return res.status(400).json({
                message: "Invalid hotel experience data",
            });
        }

        const updates = {};

        for (const field of Object.keys(experience)) {
            const urls = experience[field];

            if (
                !Array.isArray(urls) ||
                urls.length > 20 ||
                urls.some(
                    (url) =>
                        typeof url !== "string" ||
                        !url.trim() ||
                        url.trim().length > 2048
                )
            ) {
                return res.status(400).json({
                    message: `Invalid image list: ${field}`,
                });
            }

            const invalidUrl = urls.some((value) => {
                try {
                    const url = new URL(value.trim());
                    return url.protocol !== "https:";
                } catch {
                    return true;
                }
            });

            if (invalidUrl) {
                return res.status(400).json({
                    message: "All image URLs must use HTTPS",
                });
            }

            updates[`experience.${field}`] =
                urls.map((url) => url.trim());
        }

        const hotel = await hotelModel.findByIdAndUpdate(
            hotelId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        return res.status(200).json({
            message: "Hotel experience photos updated successfully",
            hotel,
        });
    } catch (error) {
        console.error("Update hotel experience error:", error);

        return res.status(500).json({
            message: "Failed to update hotel experience photos",
        });
    }
}



async function getHotelById(req, res) {
    try {
        const { hotelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                message: "Invalid hotel ID",
            });
        }

        const hotel = await hotelModel
            .findOne({
                _id: hotelId,
                status: "active",
            })
            .select("-__v");

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        return res.status(200).json({
            message: "Hotel fetched successfully",
            hotel,
        });

    } catch (error) {
        console.error("Get hotel by ID error:", error);

        return res.status(500).json({
            message: "Failed to fetch hotel",
        });
    }
}


async function deleteHotel(req, res) {
    try {
        const { hotelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({ message: "Invalid hotel ID" });
        }

        const hotel = await hotelModel.findById(hotelId);

        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        const rooms = await roomModel.find({ hotel: hotelId })
            .select("_id")
            .lean();

        const roomIds = rooms.map((room) => room._id);

        // Booking/payment history ko safe rakho
        const hasBookings = await bookingModel.exists({
            $or: [
                { hotel: hotelId },
                { room: { $in: roomIds } },
            ],
        });

        if (hasBookings) {
            return res.status(409).json({
                message: "Hotel cannot be permanently deleted because booking records exist.",
            });
        }

        // Bookings nahi hain, toh pehle linked rooms delete karo
        await roomModel.deleteMany({ hotel: hotelId });

        // Ab hotel delete karo
        await hotelModel.deleteOne({ _id: hotelId });

        return res.status(200).json({
            message: "Hotel and its rooms deleted successfully.",
        });
    } catch (error) {
        console.error("Delete hotel error:", error);

        return res.status(500).json({
            message: "Failed to delete hotel.",
        });
    }
}



module.exports = {
    createHotel,
    getHotels,
    getAdminHotels,
    updateHotelStatus,
    updateHotelImages,
        updateHotelExperience,
    getHotelById,
    deleteHotel
};