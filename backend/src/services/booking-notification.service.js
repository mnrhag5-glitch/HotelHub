
const bookingNotificationModel = require("../model/booking-notification.model");
const bookingModel = require("../model/booking.model");

async function queueBookingConfirmationNotification(bookingId) {
  if (!bookingId) {
    throw new Error("Booking ID is required to queue notification");
  }

  const booking = await bookingModel
    .findById(bookingId)
    .populate({
      path: "hotel",
      select: "owner",
      populate: {
        path: "owner",
        select: "email",
      },
    })
    .lean();

  const recipientEmail = booking?.hotel?.owner?.email?.trim().toLowerCase();

  if (!booking || booking.paymentStatus !== "paid" ||
      booking.status !== "confirmed") {
    throw new Error("Only confirmed, paid bookings can be queued");
  }

  if (!recipientEmail) {
    throw new Error("Hotel owner email not found");
  }

  try {
    return await bookingNotificationModel.findOneAndUpdate(
      { booking: booking._id },
      {
        $setOnInsert: {
          booking: booking._id,
          type: "hotel_owner_booking_confirmed",
          recipientEmail,
          status: "pending",
          attempts: 0,
          nextRetryAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    if (error.code === 11000) {
      const existing = await bookingNotificationModel.findOne({
        booking: booking._id,
      });

      if (existing) return existing;
    }

    throw error;
  }
}

module.exports = {
  queueBookingConfirmationNotification,
};
