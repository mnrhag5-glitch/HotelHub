const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["processing", "processed"],
      default: "processing",
    },processingStartedAt: {
  type: Date,
  default: null,
  index: true,
},

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const paymentEventModel = mongoose.model(
  "PaymentEvent",
  paymentEventSchema
);

module.exports = paymentEventModel;