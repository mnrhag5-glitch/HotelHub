const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    roomType: {
      type: String,
      enum: ["single", "double", "deluxe", "suite", "family"],
      required: true,
    },

    capacity: {
      adults: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
        validate: Number.isInteger,
      },

   
children: {
  type: Number,
  default: 0,
  min: 0,
  max: 20,
  validate: Number.isInteger,
},

    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0.01,
      max: 10000000,
    },

    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    totalRooms: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
      validate: Number.isInteger,
    },

    reservationVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.index({
  hotel: 1,
  status: 1,
});

const roomModel = mongoose.model("Room", roomSchema);

module.exports = roomModel;
