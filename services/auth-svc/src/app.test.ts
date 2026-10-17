// app.test.ts — unit + contract-style route tests (fixture theo auth.yaml v2 +
// token-contract.md v2). Không postgres thật: InMemoryAuthRepo mirror đúng CAS
// semantics của DrizzleAuthRepo (rotation trong 1 "tx", reuse → revoke-all user,
// token lạ → không revoke gì). Hành vi CAS THẬT (atomic + expires_at gate +
// seed idempotent) chứng minh ở repo.drizzle.integration.test.ts (postgres thật)
// + curl chuỗi đầu-cuối (Rule 0 evidence).
import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { buildApp } from './app.js';
import type { Env } from './env.js';
import {
  InMemoryAuthRepo,
  aliceRow,
  bobRow,
} from './repo.test-support.js';

const SECRET = 'test-secret-at-least-32-characters!!';
const TTL_30M = '30m';

function makeEnv(): Env {
  return {
    port: 8090,
    databaseUrl: 'postgres://unused',
    jwtSecret: SECRET,
    accessTokenTtl: TTL_30M,
    authDevPassword: 'demo-password',
    usersFixturePath: null,
    corsDevOrigin: '',
    logLevel: 'error',
  };
}

function buildTestApp(repo = new InMemoryAuthRepo([aliceRow(), bobRow()])) {
  const app = buildApp({ env: makeEnv(), repo });
  return { app, repo };
}

function bearer(sub: string, overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub,
      email: 'alice@demo.local',
      roles: ['admin'],
      iss: 'auth-mock',
      ...overrides,
    },
    SECRET,
    { algorithm: 'HS256', expiresIn: '1h' },
  );
}

// ---------------------------------------------------------------- health ----

describe('health (conventions/02 rule 6 — naked + mirror /api/auth)', () => {
  it('healthz naked + mirror → 200 {"status":"ok"} (không auth)', async () => {
    const { app } = buildTestApp();
    for (const url of ['/healthz', '/api/auth/healthz']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok' });
    }
  });

  it('readyz → 200 khi DB ping ok; 503 envelope DEPENDENCY_DOWN khi DB fail (kiểm THẬT)', async () => {
    const ok = new InMemoryAuthRepo([aliceRow()]);
    const { app: appOk } = buildTestApp(ok);
    const good = await appOk.inject({ method: 'GET', url: '/readyz' });
    expect(good.statusCode).toBe(200);
    expect(good.json()).toEqual({ status: 'ok' });

    const bad = new InMemoryAuthRepo([aliceRow()]);
    bad.failPing = true;
    const { app: appBad } = buildTestApp(bad);
    const down = await appBad.inject({ method: 'GET', url: '/readyz' });
    expect(down.statusCode).toBe(503);
    expect(down.json().error.code).toBe('DEPENDENCY_DOWN');
  });
});

// -------------------------------------------------------------- register ----

describe('POST /api/auth/register (auth.yaml v2 — 201 AuthSession)', () => {
  it('201 → {user, accessToken, refreshToken}; roles ["user"]; email lưu lowercase', async () => {
    const { app, repo } = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'Mixed.Case@Example.COM', password: 'super-secret-1', displayName: 'Mixed Case' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe('mixed.case@example.com'); // normalize trước lưu
    expect(body.user.displayName).toBe('Mixed Case');
    expect(body.user.roles).toEqual(['user']); // register luôn gán ["user"]
    expect(Object.keys(body).sort()).toEqual(['accessToken', 'refreshToken', 'user'].sort());

    // accessToken verify được: HS256 + iss PINNED + claims đúng
    const claims = jwt.verify(body.accessToken, SECRET, { algorithms: ['HS256'], issuer: 'auth-mock' }) as jwt.JwtPayload;
    expect(claims.sub).toBe(body.user.id);
    expect(claims.roles).toEqual(['user']);
    // TTL 30m (token-contract §1)
    expect(claims.exp! - claims.iat!).toBe(1800);

    // refreshToken opaque (KHÔNG phải JWT — không dấu chấm), lưu hash sha256
    expect(body.refreshToken).not.toContain('.');
    expect(body.refreshToken.length).toBeGreaterThanOrEqual(40);
    const row = repo.refreshRows.find((r) => r.userId === body.user.id);
    expect(row).toBeDefined();
    expect(row!.tokenHash).not.toBe(body.refreshToken); // DB không bao giờ chứa raw
  });

  it('validation: password <8 → 400; >72 → 400; thiếu displayName → 400; email sai format → 400 (VALIDATION_ERROR)', async () => {
    const { app } = buildTestApp();
    const cases: Array<Record<string, unknown>> = [
      { email: 'a@b.co', password: 'short7!', displayName: 'X' }, // 7 ký tự
      { email: 'a@b.co', password: 'x'.repeat(73), displayName: 'X' }, // argon2 limit
      { email: 'a@b.co', password: 'long-enough-1', displayName: '' }, // displayName rỗng
      { email: 'not-an-email', password: 'long-enough-1', displayName: 'X' },
      { password: 'long-enough-1', displayName: 'X' }, // thiếu email
    ];
    for (const payload of cases) {
      const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload });
      expect(res.statusCode, JSON.stringify(payload)).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('email trùng (khác HOA/thường) → 409 CONFLICT envelope', async () => {
    const { app } = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ALICE@demo.local', password: 'super-secret-1', displayName: 'Impostor Alice' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CONFLICT');
  });
});

// ----------------------------------------------------------------- login ----

describe('POST /api/auth/login (shape v2 — DROP tokenType/expiresIn)', () => {
  it('200 AuthSession; claims roles đúng từ seed (alice admin)', async () => {
    const { app } = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.roles).toEqual(['admin']);
    expect(body.user.id).toBe('11111111-1111-4111-8111-111111111111'); // UUID fixture giữ nguyên
    expect(body).not.toHaveProperty('tokenType'); // decision #8
    expect(body).not.toHaveProperty('expiresIn');
    const claims = jwt.verify(body.accessToken, SECRET, { issuer: 'auth-mock' }) as jwt.JwtPayload;
    expect(claims.email).toBe('alice@demo.local');
  });

  it('email normalize: HOA/thường vẫn login được (lưu + lookup cùng chuẩn lowercase)', async () => {
    const { app } = buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ALICE@Demo.Local', password: 'demo-password' },
    });
    expect(res.statusCode).toBe(200);
    // space-pad vi phạm format:email của contract → 400 (không phải 200)
    const padded = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: ' alice@demo.local ', password: 'demo-password' },
    });
    expect(padded.statusCode).toBe(400);
  });

  it('sai password / email lạ → 401 UNAUTHORIZED, cùng message (không lộ user nào tồn tại)', async () => {
    const { app } = buildTestApp();
    const wrongPass = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'wrong-password' },
    });
    const ghost = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ghost@demo.local', password: 'whatever-pass' },
    });
    expect(wrongPass.statusCode).toBe(401);
    expect(ghost.statusCode).toBe(401);
    expect(wrongPass.json().error.code).toBe('UNAUTHORIZED');
    expect(ghost.json().error.code).toBe('UNAUTHORIZED');
    expect(wrongPass.json().error.message).toBe(ghost.json().error.message);
  });
});

// --------------------------------------------------------------- refresh ----
// HEART của SF-2 — rotation CAS + reuse-detect (plan Task 2 Step 3, token-contract §3)

describe('POST /api/auth/refresh — rotation CAS + reuse-detect strict', () => {
  it('refresh lần 1 → 200 TokenPair (KHÔNG có user); old revoked + replaced_by trỏ row mới', async () => {
    const { app, repo } = buildTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    const { refreshToken } = login.json();
    const oldRow = repo.rowByToken(refreshToken)!;

    const res = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Object.keys(body).sort()).toEqual(['accessToken', 'refreshToken'].sort());
    expect(body.refreshToken).not.toBe(refreshToken); // luôn token MỚI
    jwt.verify(body.accessToken, SECRET, { issuer: 'auth-mock', subject: oldRow.userId }); // claims user giữ nguyên

    expect(oldRow.revokedAt).not.toBeNull(); // CAS revoke trong cùng "tx"
    expect(oldRow.replacedBy).not.toBeNull();
    const newRow = repo.rowByToken(body.refreshToken)!;
    expect(newRow.id).toBe(oldRow.replacedBy); // replaced_by = id token mới
    expect(newRow.revokedAt).toBeNull();
    expect(newRow.expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 3600 * 1000); // TTL 7d
  });

  it('REUSE old sau rotate → 401 + TẤT CẢ refresh_tokens của user bị revoked (strict, token-contract §3)', async () => {
    const { app, repo } = buildTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    const old1 = login.json().refreshToken;
    const r1 = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: old1 } });
    const old2 = r1.json().refreshToken; // token mới (còn sống)

    const reuse = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: old1 } });
    expect(reuse.statusCode).toBe(401);
    expect(reuse.json().error.code).toBe('UNAUTHORIZED');

    // strict: token MỚI (old2) cũng chết — toàn bộ session của user revoked
    const after = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: old2 } });
    expect(after.statusCode).toBe(401);
    const rows = repo.refreshRows.filter((r) => r.userId === login.json().user.id);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
  });

  it('TOKEN LẠ (không có row) → 401 đơn thuần, KHÔNG revoke gì (case tách theo review SF-1)', async () => {
    const { app, repo } = buildTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    const live = login.json().refreshToken;
    const crypto = await import('node:crypto');
    const stranger = crypto.randomBytes(32).toString('base64url');

    const res = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: stranger } });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
    const row = repo.rowByToken(live)!;
    expect(row.revokedAt).toBeNull(); // không biết user → không revoke gì
  });

  it('thiếu refreshToken → 400 VALIDATION_ERROR', async () => {
    const { app } = buildTestApp();
    const res = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------- logout ----

describe('POST /api/auth/logout (204 idempotent)', () => {
  it('logout → 204 + token revoked; logout LẠI cùng token → vẫn 204; token lạ → 204', async () => {
    const { app, repo } = buildTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    const rt = login.json().refreshToken;

    const first = await app.inject({ method: 'POST', url: '/api/auth/logout', payload: { refreshToken: rt } });
    expect(first.statusCode).toBe(204);
    expect(repo.rowByToken(rt)!.revokedAt).not.toBeNull();

    const second = await app.inject({ method: 'POST', url: '/api/auth/logout', payload: { refreshToken: rt } });
    expect(second.statusCode).toBe(204); // idempotent — không leak tồn tại token

    const stranger = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: { refreshToken: 'totally-unknown-token-value' },
    });
    expect(stranger.statusCode).toBe(204);
  });

  it('token đã revoked bởi refresh KHÔNG refresh được nữa (logout bằng refresh flow cũ)', async () => {
    const { app } = buildTestApp();
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'bob@demo.local', password: 'demo-password' },
    });
    const rt = login.json().refreshToken;
    await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: rt } });
    const res = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: rt } });
    expect(res.statusCode).toBe(401); // revoked → 0 rows CAS → reuse-detect
  });
});

// ------------------------------------------------------------ logout-all ----

describe('POST /api/auth/logout-all (Bearer bắt buộc — verify iss literal PINNED)', () => {
  it('thiếu/sai token/iss sai/hết hạn → 401 UNAUTHORIZED', async () => {
    const { app } = buildTestApp();
    const none = await app.inject({ method: 'POST', url: '/api/auth/logout-all' });
    expect(none.statusCode).toBe(401);
    const badSign = await app.inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { authorization: `Bearer ${jwt.sign({ sub: 'x', iss: 'auth-mock' }, 'other-secret-32-characters-long!!!')}` },
    });
    expect(badSign.statusCode).toBe(401);
    const wrongIss = await app.inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { authorization: `Bearer ${bearer('11111111-1111-4111-8111-111111111111', { iss: 'not-auth-mock' })}` },
    });
    expect(wrongIss.statusCode).toBe(401); // verify issuer literal "auth-mock" — PINNED
    const expired = await app.inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: {
        authorization: `Bearer ${jwt.sign({ sub: '11111111-1111-4111-8111-111111111111', iss: 'auth-mock' }, SECRET, { algorithm: 'HS256', expiresIn: -10 })}`,
      },
    });
    expect(expired.statusCode).toBe(401);
  });

  it('valid Bearer → 204 + mọi refresh token của sub revoked', async () => {
    const { app, repo } = buildTestApp();
    // 2 session alice (login 2 lần) — logout-all phải giết cả hai
    const s1 = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'alice@demo.local', password: 'demo-password' } });
    const s2 = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'alice@demo.local', password: 'demo-password' } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { authorization: `Bearer ${s1.json().accessToken}` },
    });
    expect(res.statusCode).toBe(204);
    for (const rt of [s1.json().refreshToken, s2.json().refreshToken]) {
      expect(repo.rowByToken(rt)!.revokedAt).not.toBeNull();
      const dead = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken: rt } });
      expect(dead.statusCode).toBe(401);
    }
  });
});

// ----------------------------------------------------------------- users ----

describe('GET /api/auth/users (giữ v1 — serve từ schema auth)', () => {
  it('200 {users:[{id,email,roles}]} — đúng shape FixtureUser (không rò password hash)', async () => {
    const { app, repo } = buildTestApp();
    repo.seedUserRow({ id: '33333333-3333-4333-8333-333333333333', email: 'carol@demo.local', displayName: 'Carol Demo', roles: ['user'], passwordHash: 'x' });
    const res = await app.inject({ method: 'GET', url: '/api/auth/users' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.users).toHaveLength(3);
    for (const u of body.users) {
      expect(Object.keys(u).sort()).toEqual(['email', 'id', 'roles'].sort());
      expect(u).not.toHaveProperty('passwordHash');
      expect(u).not.toHaveProperty('displayName');
    }
    const alice = body.users.find((u: { id: string }) => u.id === '11111111-1111-4111-8111-111111111111');
    expect(alice).toMatchObject({ id: '11111111-1111-4111-8111-111111111111', email: 'alice@demo.local', roles: ['admin'] });
  });
});

// -------------------------------------------------------------- envelope ----

describe('error envelope (conventions/04)', () => {
  it('route lạ → 404 NOT_FOUND envelope; body không phải JSON → 400', async () => {
    const { app } = buildTestApp();
    const weird = await app.inject({ method: 'GET', url: '/api/auth/unknown' });
    expect(weird.statusCode).toBe(404);
    expect(weird.json().error.code).toBe('NOT_FOUND');
    expect(weird.json().error.requestId).toBeTruthy();

    const badJson = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{broken',
    });
    expect(badJson.statusCode).toBe(400);
    expect(badJson.json().error.code).toBe('VALIDATION_ERROR');
  });
});
