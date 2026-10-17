// repo.drizzle.integration.test.ts — rotation CAS + seed CHẠY TRÊN POSTGRES
// THẬT (plan Task 2 Step 5: "integration vs postgres local"). Gate bằng env
// AUTH_SVC_TEST_DATABASE_URL — thiếu = skip (unit suite vẫn xanh không DB).
// Chạy: AUTH_SVC_TEST_DATABASE_URL="postgres://...@localhost:5432/boilerplate" pnpm test
// (CI services-auth-svc.yml cấp qua service container postgres:16.)
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import { describe, expect, it, afterAll, beforeAll } from 'vitest';
import { closeDb, createDb } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { migrationsFolder } from './app.js';
import { seedUsersFromFixture } from './db/seed.js';
import { DrizzleAuthRepo } from './repo.drizzle.js';
import { hashPassword, sha256Hex } from './auth-crypto.js';
import { refreshTokens, users } from './db/schema.js';

const TEST_URL = process.env.AUTH_SVC_TEST_DATABASE_URL ?? '';
const d = TEST_URL ? describe : describe.skip;

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(here, '../../../contracts/auth/users.json');

d('DrizzleAuthRepo — postgres thật (rotation CAS + seed idempotent)', () => {
  const { pool, db } = createDb(TEST_URL);
  const repo = new DrizzleAuthRepo(db);
  let fixtureUsers: Array<{ id: string; email: string; displayName: string; roles: string[] }> = [];

  beforeAll(async () => {
    await runMigrations(db, migrationsFolder());
    fixtureUsers = JSON.parse(readFileSync(FIXTURE, 'utf8')).users;
  });

  afterAll(async () => {
    await closeDb({ pool, db });
  });

  // ---------------------------------------------------------- schema+seed

  it('migration 0000: 2 bảng auth.users + auth.refresh_tokens tồn tại với đúng cột', async () => {
    const cols = await db.execute(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('drizzle-orm')).sql`select table_name, column_name from information_schema.columns where table_schema='auth' order by table_name, ordinal_position`,
    );
    const names = cols.rows.map((r) => `${(r as { table_name: string }).table_name}.${(r as { column_name: string }).column_name}`);
    for (const must of [
      'users.id', 'users.email', 'users.display_name', 'users.roles', 'users.password_hash', 'users.created_at',
      'refresh_tokens.id', 'refresh_tokens.user_id', 'refresh_tokens.token_hash', 'refresh_tokens.expires_at',
      'refresh_tokens.revoked_at', 'refresh_tokens.replaced_by', 'refresh_tokens.created_at',
    ]) {
      expect(names).toContain(must);
    }
  });

  it('seed idempotent: re-seed KHÔNG đè/dupplicate — 5 user fixture ổn định, UUID giữ nguyên', async () => {
    const log = { warn: () => {}, info: () => {}, error: () => {} } as never;
    // Chạy 2 lần LIÊN TIẾP: lần 2 (re-seed) PHẢI insert 0 — ON CONFLICT (id)
    // DO NOTHING. `first` = 0 hoặc 5 tuỳ DB đã seed sẵn hay chưa (fresh CI
    // container → 5); không assert cứng `first` (review P1 VU-61 round 1).
    const first = await seedUsersFromFixture(repo, FIXTURE, 'demo-password', log);
    const second = await seedUsersFromFixture(repo, FIXTURE, 'demo-password', log);
    expect(second.inserted).toBe(0);
    expect([0, 5]).toContain(first.inserted);

    const rows = await db.select().from(users).where(eq(users.id, '11111111-1111-4111-8111-111111111111'));
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('alice@demo.local');
    expect(rows[0].roles).toEqual(['admin']);
    expect(rows[0].displayName).toBe('Alice Demo');

    const all = await repo.listUsers();
    expect(all.filter((u) => fixtureUsers.some((f) => f.id === u.id))).toHaveLength(5);
  });

  it('seeded user login được bằng AUTH_DEV_PASSWORD (argon2id verify)', async () => {
    const alice = await repo.getUserByEmail('alice@demo.local');
    expect(alice).not.toBeNull();
    expect(await verify(alice!.passwordHash, 'demo-password')).toBe(true);
    expect(await verify(alice!.passwordHash, 'wrong')).toBe(false);
  });

  // ------------------------------------------------------------ users CRUD

  it('createUser → thành công; email lowercase trùng → nổ 23505 (route map → 409; normalize là việc route)', async () => {
    const id = randomUUID();
    const hash = await hashPassword('super-secret-1');
    const email = `u-${id}@example.com`; // route gửi lowercase-normalized — repo nhận như-given
    await repo.createUser({ id, email, displayName: 'U', roles: ['user'], passwordHash: hash });
    await expect(
      repo.createUser({ id: randomUUID(), email, displayName: 'Dup', roles: ['user'], passwordHash: hash }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('insertUserIfAbsent: id đã có → false, KHÔNG đè (ON CONFLICT (id) DO NOTHING)', async () => {
    const id = randomUUID();
    const hash = await hashPassword('super-secret-1');
    expect(await repo.insertUserIfAbsent({ id, email: `s-${id}@example.com`, displayName: 'S', roles: ['user'], passwordHash: hash })).toBe(true);
    expect(await repo.insertUserIfAbsent({ id, email: `other-${id}@example.com`, displayName: 'Other', roles: ['user'], passwordHash: hash })).toBe(false);
    expect((await repo.getUserById(id))!.email).toBe(`s-${id}@example.com`);
  });

  // --------------------------------------------------------- rotation CAS

  it('rotation: old revoked + replaced_by + row mới trong CÙNG tx; token hết hạn KHÔNG thắng CAS (0-rows → reuse)', async () => {
    const uid = randomUUID();
    await repo.createUser({ id: uid, email: `rot-${uid}@example.com`, displayName: 'Rot', roles: ['user'], passwordHash: await hashPassword('x'.repeat(10)) });

    const raw = randomBytes(32).toString('base64url');
    const expired = { id: randomUUID(), userId: uid, tokenHash: sha256Hex(raw), expiresAt: new Date(Date.now() - 1000) };
    await repo.insertRefreshToken(expired);

    const next = { id: randomUUID(), tokenHash: sha256Hex(randomBytes(32).toString('base64url')), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) };
    const result = await repo.rotateRefreshToken(expired.tokenHash, next);
    expect(result).toEqual({ status: 'reuse' }); // expires_at > now() enforce TTL — token-contract §3
    // reuse → revoke-all (chỉ có 1 row expired — vẫn revoked_at NOT NULL)
    const row = (await db.select().from(refreshTokens).where(eq(refreshTokens.id, expired.id)))[0];
    expect(row.revokedAt).not.toBeNull();
  });

  it('REUSE trên postgres: repo trả reuse + TẤT CẢ token user revoked', async () => {
    const uid = randomUUID();
    await repo.createUser({ id: uid, email: `reuse-${uid}@example.com`, displayName: 'Reuse', roles: ['user'], passwordHash: await hashPassword('x'.repeat(10)) });

    const raw1 = randomBytes(32).toString('base64url');
    await repo.insertRefreshToken({ id: randomUUID(), userId: uid, tokenHash: sha256Hex(raw1), expiresAt: new Date(Date.now() + 3600_000) });
    const next1 = { id: randomUUID(), tokenHash: sha256Hex(randomBytes(32).toString('base64url')), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) };
    expect(await repo.rotateRefreshToken(sha256Hex(raw1), next1)).toEqual({ status: 'ok', userId: uid });

    // old1 reuse → reuse branch revoke-all (next1 cũng chết)
    expect(await repo.rotateRefreshToken(sha256Hex(raw1), { id: randomUUID(), tokenHash: 'na', expiresAt: new Date() })).toEqual({ status: 'reuse' });
    const rows = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, uid));
    expect(rows.length).toBe(2);
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
  });

  it('2 refresh ĐỒNG THỜI cùng old token: ĐÚNG 1 thắng CAS, 1 reuse — CAS atomic trên postgres', async () => {
    const uid = randomUUID();
    await repo.createUser({ id: uid, email: `race-${uid}@example.com`, displayName: 'Race', roles: ['user'], passwordHash: await hashPassword('x'.repeat(10)) });
    const raw = randomBytes(32).toString('base64url');
    await repo.insertRefreshToken({ id: randomUUID(), userId: uid, tokenHash: sha256Hex(raw), expiresAt: new Date(Date.now() + 3600_000) });

    const mkNext = () => ({ id: randomUUID(), tokenHash: sha256Hex(randomBytes(32).toString('base64url')), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
    const [a, b] = await Promise.all([
      repo.rotateRefreshToken(sha256Hex(raw), mkNext()),
      repo.rotateRefreshToken(sha256Hex(raw), mkNext()),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(['ok', 'reuse']);
    // strict: user không còn token sống nào
    const live = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, uid));
    expect(live.filter((r) => r.revokedAt === null)).toHaveLength(0);
  });

  it('token lạ (không row) → unknown, không đổi gì trong DB', async () => {
    const before = await db.select().from(refreshTokens);
    const result = await repo.rotateRefreshToken(sha256Hex(randomBytes(32).toString('base64url')), {
      id: randomUUID(), tokenHash: 'x', expiresAt: new Date(),
    });
    expect(result).toEqual({ status: 'unknown' });
    const after = await db.select().from(refreshTokens);
    expect(after).toEqual(before); // 0 mutation
  });

  it('logout idempotent + logout-all revoke mọi token user', async () => {
    const uid = randomUUID();
    await repo.createUser({ id: uid, email: `lo-${uid}@example.com`, displayName: 'Lo', roles: ['user'], passwordHash: await hashPassword('x'.repeat(10)) });
    const raws = [randomBytes(32).toString('base64url'), randomBytes(32).toString('base64url')];
    for (const raw of raws) {
      await repo.insertRefreshToken({ id: randomUUID(), userId: uid, tokenHash: sha256Hex(raw), expiresAt: new Date(Date.now() + 3600_000) });
    }
    await repo.revokeByTokenHash(sha256Hex(raws[0]));
    await repo.revokeByTokenHash(sha256Hex(raws[0])); // lần 2 — no-op
    await repo.revokeAllForUser(uid);
    const rows = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, uid));
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
  });
});

// import muộn để gate skip không cần load — verify từ @node-rs/argon2
import { verify } from '@node-rs/argon2';
