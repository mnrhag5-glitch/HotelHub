const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    guests: {
      adults: {
        type: Number,
        required: true,
        min: 1,
      },

      children: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    roomsBooked: {
      type: Number,
      required: true,
      min: 1,
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },

    totalNights: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

status:{
  type:String,
  enum:["pending","confirmed","cancelled","completed","expired"],
  default:"pending",
  index:true
},
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    paymentProvider: {
      type: String,
      enum: ["razorpay"],
      default: null,
    },

    paymentOrderId: {
      type: String,
      default: null,
      index: true,
    },

    paymentId: {
      type: String,
      default: null,
    },
    paymentExpiresAt: {
  type: Date,
  default: null,
  index: true,
},
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({
  user: 1,
  createdAt: -1,
});

bookingSchema.index({
  hotel: 1,
  room: 1,
  checkIn: 1,
  checkOut: 1,
});

const bookingModel = mongoose.model("Booking", bookingSchema);

module.exports = bookingModel;
