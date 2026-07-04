import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    courseId: {
      type: String,
      required: true,
    },

    activeSessionId: {
      type: String,
      default: null,
    },

    sessionExpiresAt: {
      type: Number,
      default: null,
    },

    resetTokenHash: {
      type: String,
      default: null,
    },

    resetTokenExpiresAt: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);