import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    attachments: [
      {
        type: String,
        trim: true,
      },
    ],

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const connectionSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requestMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "blocked"],
      default: "pending",
      index: true,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    responseMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

connectionSchema.index(
  {
    client: 1,
    lawyer: 1,
    post: 1,
  },
  { unique: true }
);

connectionSchema.index({ client: 1, status: 1, createdAt: -1 });
connectionSchema.index({ lawyer: 1, status: 1, createdAt: -1 });
connectionSchema.index({ requestedBy: 1, createdAt: -1 });
connectionSchema.index({ post: 1, status: 1 });
connectionSchema.index({ status: 1, lastMessageAt: -1 });
connectionSchema.index({ "messages.sender": 1 });

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;