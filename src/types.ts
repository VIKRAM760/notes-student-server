export type Role = "student" | "admin";

export interface StoredUser {
  userId: string; // login id, e.g. "user1"
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  courseId: string | null; // null for admin accounts

  // single-session enforcement
  activeSessionId: string | null;
  sessionExpiresAt: number | null; // epoch ms

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
