
const mongoose = require("mongoose");

const bookingNotificationSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["hotel_owner_booking_confirmed"],
      default: "hotel_owner_booking_confirmed",
      required: true,
    },

    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed"],
      default: "pending",
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    nextRetryAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    processingStartedAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

bookingNotificationSchema.index({
  status: 1,
  nextRetryAt: 1,
});

const bookingNotificationModel = mongoose.model(
  "BookingNotification",
  bookingNotificationSchema
);

module.exports = bookingNotificationModel;
