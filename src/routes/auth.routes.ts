import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { getCourseById } from '../courses.js';
import {
  newSessionId,
  sessionDurationMs,
  signToken,
  hashToken,
  newRawResetToken,
} from '../auth.js';
import { sendResetEmail } from '../mailer.js';
import { requireAuth, type AuthedRequest } from '../middleware/authMiddleware.js';
import type { PublicUser } from '../types.js';
import UserData from '../data/users.json'
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
router.post('/login', async (req, res) => {
  const { userId, password } = req.body ?? {};

  if (!userId || !password) {
    return res.status(400).json({
      error: 'User ID and password are required.',
    });
  }

  // const user = db.findByUserId(String(userId).trim());
  const user=UserData.find((item)=>item.userId===userId)
  if (!user) {
    return res.status(401).json({
      error: 'Invalid user ID or password.',
    });
  }

  const passwordOk = await bcrypt.compare(
    String(password),
    user.passwordHash
  );

  if (!passwordOk) {
    return res.status(401).json({
      error: 'Invalid user ID or password.',
    });
  }

  const hasActiveSession =
    user.activeSessionId &&
    user.sessionExpiresAt &&
    user.sessionExpiresAt > Date.now();

  if (hasActiveSession) {
    return res.status(409).json({
      error: `"${user.userId}" is already logged in.`,
      code: 'ALREADY_LOGGED_IN',
    });
  }

  const sessionId = newSessionId();
  const sessionExpiresAt = Date.now() + sessionDurationMs();

  db.update(user.userId, {
    activeSessionId: sessionId,
    sessionExpiresAt,
  });

  const token = signToken({
    userId: user.userId,
    sessionId,
  });

  res.json({
    token,
    user: toPublicUser(
      user.userId,
      user.courseId,
      user.name,
      user.email
    ),
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, (req: AuthedRequest, res) => {
  db.update(req.auth!.userId, {
    activeSessionId: null,
    sessionExpiresAt: null,
  });

  res.json({
    ok: true,
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req: AuthedRequest, res) => {
  const user = db.findByUserId(req.auth!.userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }

  res.json({
    user: toPublicUser(
      user.userId,
      user.courseId,
      user.name,
      user.email
    ),
  });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email is required.',
    });
  }

  const user = db.findByEmail(email);

  const genericResponse = {
    message:
      'If that email is registered, a reset link has been sent.',
  };

  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = newRawResetToken();

  db.update(user.userId, {
    resetTokenHash: hashToken(rawToken),
    resetTokenExpiresAt:
      Date.now() + RESET_MINUTES * 60 * 1000,
  });

  const base =
    process.env.CLIENT_RESET_URL ||
    'http://localhost:5173/reset-password';

  const resetUrl = `${base}?token=${rawToken}&uid=${user.userId}`;

  await sendResetEmail(user.email, resetUrl);

  res.json(genericResponse);
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  const { userId, token, newPassword } = req.body;

  if (!userId || !token || !newPassword) {
    return res.status(400).json({
      error: 'Missing required fields.',
    });
  }

  const user = db.findByUserId(userId);

  if (
    !user ||
    user.resetTokenHash !== hashToken(token) ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt < Date.now()
  ) {
    return res.status(400).json({
      error: 'Invalid or expired reset token.',
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  db.update(user.userId, {
    passwordHash,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    activeSessionId: null,
    sessionExpiresAt: null,
  });

  res.json({
    message: 'Password updated successfully.',
  });
});

export default router;