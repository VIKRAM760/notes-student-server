import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/users";
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
  courseId: string,
  name: string,
  email: string
): PublicUser {
  const course = getCourseById(courseId);

  return {
    userId,
    name,
    email,
    courseId,
    courseName: course?.name || courseId,
    topics: course?.topics || [],
  };
}

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body ?? {};

    if (!userId || !password) {
      return res.status(400).json({
        error: "User ID and password are required.",
      });
    }

    const user = await User.findOne({
      userId: String(userId).trim(),
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid user ID or password.",
      });
    }

    const passwordOk = await bcrypt.compare(
      String(password),
      user.passwordHash
    );

    if (!passwordOk) {
      return res.status(401).json({
        error: "Invalid user ID or password.",
      });
    }

    const hasActiveSession =
      user.activeSessionId &&
      user.sessionExpiresAt &&
      user.sessionExpiresAt > Date.now();

    if (hasActiveSession) {
      return res.status(409).json({
        error: `"${user.userId}" is already logged in.`,
        code: "ALREADY_LOGGED_IN",
      });
    }

    const sessionId = newSessionId();
    const sessionExpiresAt = Date.now() + sessionDurationMs();

    user.activeSessionId = sessionId;
    user.sessionExpiresAt = sessionExpiresAt;

    await user.save();

    const token = signToken({
      userId: user.userId,
      sessionId,
    });

    return res.json({
      token,
      user: toPublicUser(
        user.userId,
        user.courseId,
        user.name,
        user.email
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
      await User.updateOne(
        {
          userId: req.auth!.userId,
        },
        {
          $set: {
            activeSessionId: null,
            sessionExpiresAt: null,
          },
        }
      );

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
      const user = await User.findOne({
        userId: req.auth!.userId,
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      return res.json({
        user: toPublicUser(
          user.userId,
          user.courseId,
          user.name,
          user.email
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

    const user = await User.findOne({
      email,
    });

    const genericResponse = {
      message:
        "If that email is registered, a reset link has been sent.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = newRawResetToken();

    user.resetTokenHash = hashToken(rawToken);
    user.resetTokenExpiresAt =
      Date.now() + RESET_MINUTES * 60 * 1000;

    await user.save();

    const base =
      process.env.CLIENT_RESET_URL ||
      "http://localhost:5173/reset-password";

    const resetUrl = `${base}?token=${rawToken}&uid=${user.userId}`;

    await sendResetEmail(user.email, resetUrl);

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

    const user = await User.findOne({
      userId,
    });

    if (
      !user ||
      user.resetTokenHash !== hashToken(token) ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < Date.now()
    ) {
      return res.status(400).json({
        error: "Invalid or expired reset token.",
      });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      10
    );

    user.passwordHash = passwordHash;
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    user.activeSessionId = null;
    user.sessionExpiresAt = null;

    await user.save();

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