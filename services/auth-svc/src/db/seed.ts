// seed.ts — seed user fixture từ contracts/auth/users.json (spec §Kiến trúc):
// GIỮ UUID + displayName + roles của fixture; password_hash = argon2id(AUTH_DEV_PASSWORD)
// (decision #10 — default demo-password, cùng nguồn e2e + svc-activity);
// idempotent ON CONFLICT (id) DO NOTHING — boot lại không đè user đã register
// thêm thông tin. users.json KHÔNG chứa password (chỉ $comment mapping) — file
// này đọc MỖI LẦN BOOT, hash runtime.
import { readFileSync } from 'node:fs';
import { hashPassword } from '../auth-crypto.js';
import type { AuthRepo, NewUserInput } from '../repo.js';

export interface FixtureUserEntry {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface SeedLog {
  warn(msg: string, fields?: object): void;
  info(msg: string, fields?: object): void;
}

export interface SeedResult {
  inserted: number;
  skipped: number;
}

export async function seedUsersFromFixture(
  repo: AuthRepo,
  fixturePath: string,
  devPassword: string,
  log: SeedLog,
): Promise<SeedResult> {
  const parsed: unknown = JSON.parse(readFileSync(fixturePath, 'utf8')); // thiếu/sai file = fail-fast boot
  const users = (parsed as { users?: FixtureUserEntry[] }).users;
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error(`users fixture "${fixturePath}" không có mảng users — kiểm contracts/auth/users.json`);
  }

  // 1 hash argon2id chung cho mọi fixture user (dev password chung — decision #10)
  const passwordHash = await hashPassword(devPassword);
  const result: SeedResult = { inserted: 0, skipped: 0 };
  for (const entry of users) {
    if (!entry.id || !entry.email || !entry.displayName) {
      throw new Error(`users fixture entry thiếu id/email/displayName: ${JSON.stringify(entry)}`);
    }
    const input: NewUserInput = {
      id: entry.id,
      email: entry.email.trim().toLowerCase(),
      displayName: entry.displayName,
      roles: Array.isArray(entry.roles) && entry.roles.length > 0 ? entry.roles : ['user'],
      passwordHash,
    };
    const inserted = await repo.insertUserIfAbsent(input);
    if (inserted) result.inserted += 1;
    else result.skipped += 1;
  }
  log.info('seed users fixture done', { inserted: result.inserted, skipped: result.skipped });
  return result;
}
