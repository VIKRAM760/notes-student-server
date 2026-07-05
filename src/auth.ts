import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);

export interface TokenPayload {
  userId: string;
  sessionId: string;
  role: 'student' | 'admin';
}

export function newSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function sessionDurationMs(): number {
  return SESSION_HOURS * 60 * 60 * 1000;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_HOURS}h` });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function newRawResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
