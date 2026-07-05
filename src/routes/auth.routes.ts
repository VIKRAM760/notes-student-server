import { Router } from "express";
import bcrypt from "bcryptjs";
import Student from "../models/student.model.js";
import Admin from "../models/admin.model.js";
import { getCourseById } from "../courses.js";
import {
  newSessionId,
  sessionDurationMs,
  signToken,
  hashToken,
  newRawResetToken,
} from "../auth.js";
import { sendResetEmail } from "../mailer.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../middleware/authMiddleware.js";
import type { PublicUser } from "../types.js";

const router = Router();

const RESET_MINUTES = Number(process.env.RESET_TOKEN_MINUTES || 30);

function toPublicUser(
  userId: string,
  role: "student" | "admin",
  courseId: string | null | undefined,
  name: string,
  email: string
): PublicUser {
  const course = courseId ? getCourseById(courseId) : undefined;

  return {
    userId,
    name,
    email,
    role,
    courseId: courseId ?? null,
    courseName: course?.name || null,
    topics: course?.topics || [],
  };
}

/**
 * POST /api/auth/login
 *
 * Admins and students live in separate collections. We check the admin
 * collection first:
 *  - Admins are NEVER blocked by an existing session — they can have as
 *    many concurrent sessions as they want, so login always succeeds on
 *    correct credentials.
 *  - Students are still limited to a single active session at a time.
 */
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body ?? {};

    if (!userId || !password) {
      return res.status(400).json({
        error: "User ID and password are required.",
      });
    }

    const trimmedId = String(userId).trim();

    const admin = await Admin.findOne({ userId: trimmedId });

    if (admin) {
      const passwordOk = await bcrypt.compare(String(password), admin.passwordHash);
      if (!passwordOk) {
        return res.status(401).json({ error: "Invalid user ID or password." });
      }

      // Drop any sessions that have already expired, then add the new one.
      // No cap on how many can be active at once.
      // NOTE: activeSessions is a Mongoose DocumentArray, not a plain array,
      // so we mutate it in place (splice) rather than reassigning it —
      // reassigning with a plain array/filter result doesn't satisfy the
      // DocumentArray type.
      const now = Date.now();
      const stillValid = admin.activeSessions.filter((s) => s.expiresAt > now);
      admin.activeSessions.splice(0, admin.activeSessions.length, ...stillValid);

      const sessionId = newSessionId();
      const sessionExpiresAt = now + sessionDurationMs();
      admin.activeSessions.push({ sessionId, expiresAt: sessionExpiresAt });

      await admin.save();

      const token = signToken({ userId: admin.userId, sessionId, role: "admin" });

      return res.json({
        token,
        user: toPublicUser(admin.userId, "admin", null, admin.name, admin.email),
      });
    }

    const student = await Student.findOne({ userId: trimmedId });

    if (!student) {
      return res.status(401).json({
        error: "Invalid user ID or password.",
      });
    }

    const passwordOk = await bcrypt.compare(
      String(password),
      student.passwordHash
    );

    if (!passwordOk) {
      return res.status(401).json({
        error: "Invalid user ID or password.",
      });
    }

    const hasActiveSession =
      student.activeSessionId &&
      student.sessionExpiresAt &&
      student.sessionExpiresAt > Date.now();

    if (hasActiveSession) {
      return res.status(409).json({
        error: `"${student.userId}" is already logged in.`,
        code: "ALREADY_LOGGED_IN",
      });
    }

    const sessionId = newSessionId();
    const sessionExpiresAt = Date.now() + sessionDurationMs();

    student.activeSessionId = sessionId;
    student.sessionExpiresAt = sessionExpiresAt;

    await student.save();

    const token = signToken({
      userId: student.userId,
      sessionId,
      role: "student",
    });

    return res.json({
      token,
      user: toPublicUser(
        student.userId,
        "student",
        student.courseId,
        student.name,
        student.email
      ),
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
});

/**
 * POST /api/auth/logout
 */
router.post(
  "/logout",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      if (req.auth!.role === "admin") {
        // Only remove THIS session — other concurrent admin sessions stay logged in.
        await Admin.updateOne(
          { userId: req.auth!.userId },
          { $pull: { activeSessions: { sessionId: req.auth!.sessionId } } }
        );
      } else {
        await Student.updateOne(
          { userId: req.auth!.userId },
          { $set: { activeSessionId: null, sessionExpiresAt: null } }
        );
      }

      return res.json({
        ok: true,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: "Internal server error.",
      });
    }
  }
);

/**
 * GET /api/auth/me
 */
router.get(
  "/me",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      if (req.auth!.role === "admin") {
        const admin = await Admin.findOne({ userId: req.auth!.userId });
        if (!admin) {
          return res.status(404).json({ error: "User not found." });
        }
        return res.json({
          user: toPublicUser(admin.userId, "admin", null, admin.name, admin.email),
        });
      }

      const student = await Student.findOne({ userId: req.auth!.userId });

      if (!student) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      return res.json({
        user: toPublicUser(
          student.userId,
          "student",
          student.courseId,
          student.name,
          student.email
        ),
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: "Internal server error.",
      });
    }
  }
);

/**
 * POST /api/auth/forgot-password
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const genericResponse = {
      message:
        "If that email is registered, a reset link has been sent.",
    };

    const admin = await Admin.findOne({ email });
    const student = admin ? null : await Student.findOne({ email });
    const account = admin || student;

    if (!account) {
      return res.json(genericResponse);
    }

    const rawToken = newRawResetToken();

    account.resetTokenHash = hashToken(rawToken);
    account.resetTokenExpiresAt = Date.now() + RESET_MINUTES * 60 * 1000;

    await account.save();

    const base =
      process.env.CLIENT_RESET_URL ||
      "http://localhost:5173/reset-password";

    const resetUrl = `${base}?token=${rawToken}&uid=${account.userId}`;

    await sendResetEmail(account.email, resetUrl);

    return res.json(genericResponse);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;

    if (!userId || !token || !newPassword) {
      return res.status(400).json({
        error: "Missing required fields.",
      });
    }

    const admin = await Admin.findOne({ userId });
    const student = admin ? null : await Student.findOne({ userId });
    const account = admin || student;

    if (
      !account ||
      account.resetTokenHash !== hashToken(token) ||
      !account.resetTokenExpiresAt ||
      account.resetTokenExpiresAt < Date.now()
    ) {
      return res.status(400).json({
        error: "Invalid or expired reset token.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    account.passwordHash = passwordHash;
    account.resetTokenHash = null;
    account.resetTokenExpiresAt = null;

    if (account === student) {
      student!.activeSessionId = null;
      student!.sessionExpiresAt = null;
    } else {
      // Clear all admin sessions in place (DocumentArray, can't reassign to []).
      admin!.activeSessions.splice(0, admin!.activeSessions.length);
    }

    await account.save();

    return res.json({
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
});

export default router;
