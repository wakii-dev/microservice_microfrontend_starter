// repo.test-support.ts — InMemoryAuthRepo: mirror ĐÚNG semantics của
// DrizzleAuthRepo (rotation CAS 1 "tx": select row → CAS revoked_at IS NULL
// AND expires_at > now → 0 rows = reuse → revoke-all user; token lạ → không
// revoke). Chỉ dùng bởi *.test.ts — excluded khỏi build (tsconfig).
// Atomicity THẬT trên postgres được chứng minh ở repo.drizzle.integration.test.ts.
import { randomUUID } from 'node:crypto';
import { hashPassword, sha256Hex } from './auth-crypto.js';
import type {
  AuthRepo,
  AuthUser,
  AuthUserWithHash,
  FixtureUser,
  NewRefreshTokenInput,
  NewUserInput,
  RotateResult,
} from './repo.js';

const DEMO_HASH = await hashPassword('demo-password');

export interface UserRow extends AuthUserWithHash {
  createdAt: Date;
}

export interface RefreshRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
}

export function aliceRow(): UserRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'alice@demo.local',
    displayName: 'Alice Demo',
    roles: ['admin'],
    passwordHash: DEMO_HASH,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
}

export function bobRow(): UserRow {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'bob@demo.local',
    displayName: 'Bob Demo',
    roles: ['user'],
    passwordHash: DEMO_HASH,
    createdAt: new Date('2026-01-01T00:00:01Z'),
  };
}

function duplicateEmailError(): Error & { code: string } {
  const err = new Error('duplicate key value violates unique constraint "users_email_unique"') as Error & { code: string };
  err.code = '23505';
  return err;
}

export class InMemoryAuthRepo implements AuthRepo {
  users = new Map<string, UserRow>();
  refreshRows: RefreshRow[] = [];
  failPing = false;

  constructor(seed: UserRow[] = []) {
    for (const row of seed) this.users.set(row.id, { ...row });
  }

  seedUserRow(row: UserRow): void {
    this.users.set(row.id, { createdAt: new Date(0), ...row });
  }

  rowByToken(rawToken: string): RefreshRow | undefined {
    const hash = sha256Hex(rawToken);
    return this.refreshRows.find((r) => r.tokenHash === hash);
  }

  async ping(): Promise<void> {
    if (this.failPing) throw new Error('db down');
  }

  async listUsers(): Promise<FixtureUser[]> {
    return [...this.users.values()]
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) || a.id.localeCompare(b.id))
      .map((u) => ({ id: u.id, email: u.email, roles: [...u.roles] }));
  }

  async getUserByEmail(email: string): Promise<AuthUserWithHash | null> {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email === normalized) return { id: u.id, email: u.email, displayName: u.displayName, roles: [...u.roles], passwordHash: u.passwordHash };
    }
    return null;
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    const u = this.users.get(id);
    return u ? { id: u.id, email: u.email, displayName: u.displayName, roles: [...u.roles] } : null;
  }

  async createUser(input: NewUserInput): Promise<AuthUser> {
    const normalized = input.email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email === normalized) throw duplicateEmailError();
    }
    const row: UserRow = { ...input, email: normalized, roles: [...input.roles], createdAt: new Date() };
    this.users.set(row.id, row);
    return { id: row.id, email: row.email, displayName: row.displayName, roles: [...row.roles] };
  }

  async insertUserIfAbsent(input: NewUserInput): Promise<boolean> {
    if (this.users.has(input.id)) return false; // ON CONFLICT (id) DO NOTHING
    const normalized = input.email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email === normalized) return false;
    }
    this.users.set(input.id, { ...input, email: normalized, roles: [...input.roles], createdAt: new Date() });
    return true;
  }

  async insertRefreshToken(input: NewRefreshTokenInput): Promise<void> {
    this.refreshRows.push({ ...input, revokedAt: null, replacedBy: null, createdAt: new Date() });
  }

  // CAS semantics của DrizzleAuthRepo — KHÔNG atomic thật (postgres chứng minh),
  // nhưng cùng luật: revoked_at IS NULL AND expires_at > now().
  async rotateRefreshToken(oldTokenHash: string, next: Omit<NewRefreshTokenInput, 'userId'>): Promise<RotateResult> {
    const old = this.refreshRows.find((r) => r.tokenHash === oldTokenHash);
    if (!old) return { status: 'unknown' };
    const now = new Date();
    const wins = old.revokedAt === null && old.expiresAt.getTime() > now.getTime();
    if (!wins) {
      // reuse-detect: revoke TẤT CẢ của user (token-contract §3)
      for (const r of this.refreshRows) {
        if (r.userId === old.userId && r.revokedAt === null) r.revokedAt = now;
      }
      return { status: 'reuse' };
    }
    old.revokedAt = now;
    old.replacedBy = next.id;
    this.refreshRows.push({ ...next, userId: old.userId, revokedAt: null, replacedBy: null, createdAt: now });
    return { status: 'ok', userId: old.userId };
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    const row = this.refreshRows.find((r) => r.tokenHash === tokenHash);
    if (row && row.revokedAt === null) row.revokedAt = new Date();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const now = new Date();
    for (const r of this.refreshRows) {
      if (r.userId === userId && r.revokedAt === null) r.revokedAt = now;
    }
  }
}

export function makeRefreshInput(userId: string, rawToken: string, ttlMs = 7 * 24 * 3600 * 1000): NewRefreshTokenInput & { token: string } {
  return {
    id: randomUUID(),
    userId,
    tokenHash: sha256Hex(rawToken),
    expiresAt: new Date(Date.now() + ttlMs),
    token: rawToken,
  };
}
