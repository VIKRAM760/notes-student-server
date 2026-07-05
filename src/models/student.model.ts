import mongoose from "mongoose";

/**
 * Students live in their own collection ("students"), completely separate
 * from admin accounts. A student may only ever have ONE active session at a
 * time (activeSessionId / sessionExpiresAt enforce that).
 */
const StudentSchema = new mongoose.Schema(
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

    // single-session enforcement
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
    collection: "students",
  }
);

export default mongoose.model("Student", StudentSchema);
