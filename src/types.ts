export type Role = "student" | "admin";

export interface StoredStudent {
  userId: string; // login id, e.g. "user1"
  name: string;
  email: string;
  passwordHash: string;
  courseId: string;

  // single-session enforcement
  activeSessionId: string | null;
  sessionExpiresAt: number | null; // epoch ms

  // password reset
  resetTokenHash: string | null;
  resetTokenExpiresAt: number | null; // epoch ms
}

export interface StoredAdminSession {
  sessionId: string;
  expiresAt: number; // epoch ms
  createdAt: number; // epoch ms
}

export interface StoredAdmin {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;

  // unlimited concurrent sessions
  activeSessions: StoredAdminSession[];

  // password reset
  resetTokenHash: string | null;
  resetTokenExpiresAt: number | null; // epoch ms
}

export interface PublicUser {
  userId: string;
  name: string;
  email: string;
  role: Role;
  courseId: string | null;
  courseName: string | null;
  topics: string[];
}
