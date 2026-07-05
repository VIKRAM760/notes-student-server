import mongoose from "mongoose";

/**
 * Admins live in their own collection ("admins"), completely separate from
 * student accounts.
 *
 * Unlike students, admins are NOT limited to a single active session.
 * Every successful login pushes a new entry onto `activeSessions` instead of
 * overwriting/rejecting based on one slot, so an admin can be logged in on
 * as many devices/tabs as they like at the same time. Logging out only
 * removes that one session; expired sessions are lazily cleaned up.
 */
const AdminSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    expiresAt: { type: Number, required: true },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { _id: false }
);

const AdminSchema = new mongoose.Schema(
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

    // no limit on the number of concurrent sessions
    activeSessions: {
      type: [AdminSessionSchema],
      default: [],
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
    collection: "admins",
  }
);

export default mongoose.model("Admin", AdminSchema);
