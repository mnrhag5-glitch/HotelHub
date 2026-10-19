const mongoose = require("mongoose");

const bookingModel = require("../model/booking.model");
const roomModel = require("../model/room.model");
const hotelModel = require("../model/hotel.model");
const userModel = require("../model/user.model");

async function checkRoomAvailability(req, res) {
    try {
        const {
            roomId,
            checkIn,
            checkOut,
            roomsBooked,
        } = req.body;

        // Required fields
        if (!roomId || !checkIn || !checkOut || !roomsBooked) {
            return res.status(400).json({
                message: "Room, check-in, check-out and rooms are required",
            });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid room ID",
            });
        }

        // Validate room count
        if (!Number.isInteger(roomsBooked) || roomsBooked < 1) {
            return res.status(400).json({
                message: "Invalid number of rooms",
            });
        }

        // Convert dates
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        // Validate dates
        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid booking dates",
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                message: "Check-out must be after check-in",
            });
        }

        // Find room
        const room = await roomModel.findOne({
            _id: roomId,
            status: "active",
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found",
            });
        }

        // Check hotel
        const hotel = await hotelModel.findOne({
            _id: room.hotel,
            status: "active",
        });

        if (!hotel) {
            return res.status(404).json({
                message: "Hotel not found",
            });
        }

 const now = new Date();

const existingBookings = await bookingModel.find({
    room: roomId,

    checkIn: {
        $lt: endDate,
    },

    checkOut: {
        $gt: startDate,
    },

    $or: [
        {
            status: "confirmed",
        },
        {
            status: "pending",
            paymentExpiresAt: {
                $gt: now,
            },
        },
    ],
});

        // Calculate already booked rooms
        const bookedRooms = existingBookings.reduce(
            (total, booking) => total + booking.roomsBooked,
            0
        );

        const availableRooms = room.totalRooms - bookedRooms;

        if (roomsBooked > availableRooms) {
            return res.status(409).json({
                available: false,
                availableRooms,
                message: "Not enough rooms available",
            });
        }

        return res.status(200).json({
            available: true,
            availableRooms,
            message: "Rooms are available",
        });

    } catch (error) {
        console.error("Check room availability error:", error);

        return res.status(500).json({
            message: "Failed to check room availability",
        });
    }
}

async function createBooking(req, res) {
    const session = await mongoose.startSession();

    try {
      const {
    roomId,
    checkIn,
    checkOut,
    guests,
    roomsBooked,
    phone,
} = req.body;

        if (
            !roomId ||
            !checkIn ||
            !checkOut ||
            !guests ||
            !roomsBooked
        ) {
            return res.status(400).json({
                message: "Room, dates, guests and rooms are required",
            });
        }

const normalizedPhone =
    typeof phone === "string" ? phone.trim() : "";

if (!/^\+?[0-9\s()-]{7,20}$/.test(normalizedPhone)) {
    return res.status(400).json({
        message: "Please provide a valid phone number",
    });
}

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid room ID",
            });
        }

        if (!Number.isInteger(roomsBooked) || roomsBooked < 1) {
            return res.status(400).json({
                message: "Invalid number of rooms",
            });
        }

        if (
            !Number.isInteger(guests.adults) ||
            guests.adults < 1 ||
            !Number.isInteger(guests.children) ||
            guests.children < 0
        ) {
            return res.status(400).json({
                message: "Invalid guest details",
            });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid booking dates",
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                message: "Check-out must be after check-in",
            });
        }

        session.startTransaction();
      const user = await userModel.findById(
    req.user.user_id
).session(session);

if (!user) {
    await session.abortTransaction();

    return res.status(404).json({
        message: "User account not found",
    });
}

user.phone = normalizedPhone;
await user.save({ session });
        const room = await roomModel.findOne(
            {
                _id: roomId,
                status: "active",
            },
            null,
            { session }
        );

        if (!room) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Room not found",
            });
        }

        const hotel = await hotelModel.findOne(
            {
                _id: room.hotel,
                status: "active",
            },
            null,
            { session }
        );

        if (!hotel) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Hotel not found",
            });
        }

        if (
            guests.adults > room.capacity.adults * roomsBooked ||
            guests.children > room.capacity.children * roomsBooked
        ) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Guest count exceeds room capacity",
            });
        }
// Serialize concurrent booking attempts for the same room.
const roomLock = await roomModel.updateOne(
    {
        _id: roomId,
        status: "active",
    },
    {
        $inc: { reservationVersion: 1 },
    },
    { session }
);

if (roomLock.modifiedCount !== 1) {
    await session.abortTransaction();

    return res.status(409).json({
        message: "Room availability changed. Please try again.",
    });
}

        const now = new Date();

const existingBookings = await bookingModel.find(
    {
        room: roomId,

        checkIn: {
            $lt: endDate,
        },

        checkOut: {
            $gt: startDate,
        },

        $or: [
            {
                status: "confirmed",
            },
            {
                status: "pending",
                paymentExpiresAt: {
                    $gt: now,
                },
            },
        ],
    },
    null,
    { session }
);

        const bookedRooms = existingBookings.reduce(
            (total, booking) =>
                total + booking.roomsBooked,
            0
        );

        const availableRooms =
            room.totalRooms - bookedRooms;

        if (roomsBooked > availableRooms) {
            await session.abortTransaction();

            return res.status(409).json({
                message: "Not enough rooms available",
                availableRooms,
            });
        }

        const millisecondsPerDay =
            1000 * 60 * 60 * 24;

        const totalNights = Math.ceil(
            (endDate - startDate) /
            millisecondsPerDay
        );

        const totalAmount =
            room.pricePerNight *
            totalNights *
            roomsBooked;

            const paymentExpiresAt = new Date(
    Date.now() + 15 * 60 * 1000
);

        const [booking] = await bookingModel.create(
            [
                {
                    user: req.user.user_id,
                    hotel: hotel._id,
                    room: room._id,
                    checkIn: startDate,
                    checkOut: endDate,
                    guests,
                    roomsBooked,
                    pricePerNight: room.pricePerNight,
                    totalNights,
                    totalAmount,
                    paymentExpiresAt,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return res.status(201).json({
            message: "Booking created successfully",
            booking,
        });

    } catch (error) {
        await session.abortTransaction();

        console.error(
            "Create booking error:",
            error
        );

        return res.status(500).json({
            message: "Failed to create booking",
        });

    } finally {
        await session.endSession();
    }
}

async function getMyBookings(req, res) {
    try {
        const bookings = await bookingModel
            .find({
                user: req.user.user_id,
            })
            .populate("hotel", "name location images")
            .populate(
                "room",
                "name roomType pricePerNight images"
            )
            .select("-__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Bookings fetched successfully",
            bookings,
        });

    } catch (error) {
        console.error("Get my bookings error:", error);

        return res.status(500).json({
            message: "Failed to fetch bookings",
        });
    }
}


async function getAllBookings(req, res) {
  try {
    const bookings = await bookingModel
      .find({})
      .populate("user", "name email phone")
      .populate("hotel", "name location")
      .populate("room", "name roomType pricePerNight")
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "All bookings fetched successfully",
      bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);

    return res.status(500).json({
      message: "Failed to fetch bookings",
    });
  }
}


async function cancelBooking(req, res) {
    try {
        const { bookingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID",
            });
        }

        const booking = await bookingModel.findOne({
            _id: bookingId,
            user: req.user.user_id,
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking is already cancelled",
            });
        }

        if (booking.status === "completed") {
            return res.status(400).json({
                message: "Completed booking cannot be cancelled",
            });
        }

        booking.status = "cancelled";

        await booking.save();

        return res.status(200).json({
            message: "Booking cancelled successfully",
            booking,
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            message: "Failed to cancel booking",
        });
    }
}


async function expirePendingBookings(req, res) {
  try {
    const now = new Date();

    const result = await bookingModel.updateMany(
      {
        status: "pending",
        paymentStatus: "pending",
        paymentExpiresAt: {
          $lte: now,
          $ne: null,
        },
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    return res.status(200).json({
      message: "Expired bookings processed successfully",
      expiredCount: result.modifiedCount,
    });

  } catch (error) {
    console.error("Expire pending bookings error:", error);

    return res.status(500).json({
      message: "Failed to process expired bookings",
    });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "confirmed",
      "cancelled",
      "completed",
    ];

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid booking status",
      });
    }

    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    
if (status === "completed") {
  if (!booking.checkOut) {
    return res.status(400).json({
      message: "Checkout date is missing for this booking.",
    });
  }

  const now = new Date();
  const checkoutDate = new Date(booking.checkOut);

  // Compare calendar dates in UTC to avoid time-of-day issues.
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const checkoutUTC = Date.UTC(
    checkoutDate.getUTCFullYear(),
    checkoutDate.getUTCMonth(),
    checkoutDate.getUTCDate()
  );

  if (todayUTC < checkoutUTC) {
    return res.status(400).json({
      message: "Booking cannot be completed before the checkout date.",
    });
  }
}


    if (booking.status === "expired" || booking.status === "cancelled") {
      return res.status(400).json({
        message: `Cannot update a ${booking.status} booking`,
      });
    }

    if (booking.status === "completed" && status !== "completed") {
      return res.status(400).json({
        message: "Completed bookings cannot be reopened",
      });
    }

    if (status === "confirmed" && booking.paymentStatus !== "paid") {
      return res.status(400).json({
        message: "Only paid bookings can be confirmed",
      });
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);

    return res.status(500).json({
      message: "Failed to update booking status",
    });
  }
}


module.exports = {
    checkRoomAvailability,
    createBooking,
    updateBookingStatus,
    getMyBookings,
      getAllBookings,
    cancelBooking,
    expirePendingBookings,
  
};
