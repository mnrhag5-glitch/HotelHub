const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

location: {
    address: {
        type: String,
        required: true,
        trim: true,
    },

    city: {
        type: String,
        required: true,
        trim: true,
    },

    state: {
        type: String,
        required: true,
        trim: true,
    },

    country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
    },

    coordinates: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
            default: "Point",
        },

        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function (value) {
                    return (
                        value.length === 2 &&
                        value[0] >= -180 &&
                        value[0] <= 180 &&
                        value[1] >= -90 &&
                        value[1] <= 90
                    );
                },
                message: "Invalid coordinates",
            },
        },
    },
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

    experience: {
      foodAndDining: {
        type: [String],
        default: [],
      },

      staffAndHospitality: {
        type: [String],
        default: [],
      },

      viewsAndSurroundings: {
        type: [String],
        default: [],
      },

      bedrooms: {
        type: [String],
        default: [],
      },
    },


    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
      index: true,
    },
    contact: {
      phone: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

hotelSchema.index({
  "location.city": 1,
});

hotelSchema.index({
  owner: 1,
});

hotelSchema.index({
  isActive: 1,
});


hotelSchema.index({
    "location.coordinates": "2dsphere",
});

const hotelModel = mongoose.model("Hotel", hotelSchema);

module.exports = hotelModel;
