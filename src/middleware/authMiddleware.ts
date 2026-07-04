import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth';
import User from "../models/users.js";

export interface AuthedRequest extends Request {
  auth?: { userId: string; sessionId: string };
}

 export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const user = await User.findOne({
    userId: payload.userId,
  });
  const sessionStillValid =
    user &&
    user.activeSessionId === payload.sessionId &&
    user.sessionExpiresAt &&
    user.sessionExpiresAt > Date.now();

  if (!sessionStillValid) {
    return res
      .status(401)
      .json({ error: 'This session is no longer active — you may have logged in elsewhere.' });
  }

  req.auth = { userId: payload.userId, sessionId: payload.sessionId };
  next();
}
