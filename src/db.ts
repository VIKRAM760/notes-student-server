import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import type { StoredUser } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'users.json');

function readAll(): StoredUser[] {
  if (!existsSync(DB_PATH)) return [];
  const raw = readFileSync(DB_PATH, 'utf-8');
  return raw.trim() ? JSON.parse(raw) : [];
}

function writeAll(users: StoredUser[]): void {
  writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

export const db = {
  findByUserId(userId: string): StoredUser | undefined {
    return readAll().find((u) => u.userId.toLowerCase() === userId.toLowerCase());
  },

  findByEmail(email: string): StoredUser | undefined {
    return readAll().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  seedIfEmpty(seed: StoredUser[]): void {
    if (!existsSync(DB_PATH) || readAll().length === 0) {
      writeAll(seed);
    }
  },

  update(userId: string, patch: Partial<StoredUser>): StoredUser | undefined {
    const users = readAll();
    const idx = users.findIndex((u) => u.userId.toLowerCase() === userId.toLowerCase());
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...patch };
    writeAll(users);
    return users[idx];
  },

  all(): StoredUser[] {
    return readAll();
  },
};
