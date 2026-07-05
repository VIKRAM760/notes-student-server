import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';
import Student from '../models/student.model.js';
import Admin from '../models/admin.model.js';

export interface AuthedRequest extends Request {
  auth?: { userId: string; sessionId: string; role: 'student' | 'admin' };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.role) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  if (payload.role === 'admin') {
    // Admins can hold any number of concurrent sessions, so we just need to
    // confirm this particular session is one of the (still valid) ones.
    const admin = await Admin.findOne({ userId: payload.userId });

    const sessionStillValid =
      admin &&
      admin.activeSessions.some(
        (s) => s.sessionId === payload.sessionId && s.expiresAt > Date.now()
      );

    if (!sessionStillValid) {
      return res
        .status(401)
        .json({ error: 'Session expired. Please log in again.' });
    }

    req.auth = { userId: payload.userId, sessionId: payload.sessionId, role: 'admin' };
    return next();
  }

  // student: single active session enforcement
  const student = await Student.findOne({ userId: payload.userId });
  const sessionStillValid =
    student &&
    student.activeSessionId === payload.sessionId &&
    student.sessionExpiresAt &&
    student.sessionExpiresAt > Date.now();

  if (!sessionStillValid) {
    return res
      .status(401)
      .json({ error: 'This session is no longer active — you may have logged in elsewhere.' });
  }

  req.auth = { userId: payload.userId, sessionId: payload.sessionId, role: 'student' };
  next();
}
