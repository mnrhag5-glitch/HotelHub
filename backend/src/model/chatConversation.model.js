const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

chatConversationSchema.index(
  { hotel: 1, customer: 1 },
  { unique: true }
);

chatConversationSchema.index({
  hotel: 1,
  lastMessageAt: -1,
});

module.exports = mongoose.model(
  "ChatConversation",
  chatConversationSchema
);