export interface StoredUser {
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

export interface PublicUser {
  userId: string;
  name: string;
  email: string;
  courseId: string;
  courseName: string;
  topics: string[];
}
