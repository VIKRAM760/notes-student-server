import bcrypt from 'bcryptjs';
import { db } from './db.js';
import type { StoredUser } from './types.js';

const demoUsers: Array<Pick<StoredUser, 'userId' | 'name' | 'email' | 'courseId'> & { password: string }> = [
  { userId: 'user1', name: 'Ava (Frontend)', email: 'user1@example.com', courseId: 'frontend-development', password: 'Frontend@123' },
  { userId: 'user2', name: 'Liam (Backend)', email: 'user2@example.com', courseId: 'backend-development', password: 'Backend@123' },
  { userId: 'user3', name: 'Noah (Tools)', email: 'user3@example.com', courseId: 'tools-devops', password: 'Tools@123' },
  { userId: 'admin', name: 'Admin (Full-Stack)', email: 'admin@example.com', courseId: 'fullstack-development', password: 'Admin@123' },
];

const seed: StoredUser[] = demoUsers.map((u) => ({
  userId: u.userId,
  name: u.name,
  email: u.email,
  passwordHash: bcrypt.hashSync(u.password, 10),
  courseId: u.courseId,
  activeSessionId: null,
  sessionExpiresAt: null,
  resetTokenHash: null,
  resetTokenExpiresAt: null,
}));

db.seedIfEmpty(seed);

console.log('Seeded demo accounts (userId / password):');
demoUsers.forEach((u) => console.log(`  ${u.userId} / ${u.password}  ->  ${u.courseId}`));
