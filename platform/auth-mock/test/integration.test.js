// Integration test — real-path e2e qua app instance (KHÔNG mock jwt/fixtures):
// boot app với fixture thật của repo → login user fixture → verify JWT bằng
// chính thư viện → gọi lại API với Bearer token. Đường đi y như production.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { buildApp } from '../src/app.js';

// fixture THẬT của repo (contracts/auth/users.json) — không phải fixture test tự bịa
const REPO_FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'contracts', 'auth', 'users.json');
// endpoint /api/auth/users trả đúng toàn bộ fixture — đếm theo fixture thay vì hard-code
// (trước đây assert cứng 3, gãy khi FI-77 thêm svc-activity/svc-fail → 5 user)
const FIXTURE_USER_COUNT = JSON.parse(readFileSync(REPO_FIXTURE, 'utf8')).users.length;
const SECRET = 'integration-test-secret-at-least-32-chars!';

test('real-path: login fixture thật → JWT verify → dùng Bearer gọi endpoint', async () => {
  const app = await buildApp({
    usersFixturePath: REPO_FIXTURE,
    jwtSecret: SECRET,
    devPassword: 'demo-password',
    corsDevOrigin: '',
  });
  try {
    // 1. healthz + readyz (real state sau boot với fixture thật — 3 users)
    assert.equal((await app.inject({ method: 'GET', url: '/healthz' })).statusCode, 200);
    assert.equal((await app.inject({ method: 'GET', url: '/api/auth/readyz' })).statusCode, 200);

    // 2. login alice (fixture thật) qua mirror route (đường gateway)
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    assert.equal(login.statusCode, 200);
    const { accessToken, expiresIn } = login.json();
    assert.equal(expiresIn, 28800);

    // 3. verify JWT bằng thư viện (signature + expiry + claims thật của fixture)
    const claims = jwt.verify(accessToken, SECRET, { algorithms: ['HS256'] });
    assert.equal(claims.email, 'alice@demo.local');
    assert.ok(['alice@demo.local', 'bob@demo.local', 'carol@demo.local'].includes(claims.email));
    assert.equal(claims.exp - claims.iat, 28800);

    // 4. fixture users endpoint trả đúng toàn bộ user trong fixture
    const users = (await app.inject({ method: 'GET', url: '/api/auth/users' })).json();
    assert.equal(users.users.length, FIXTURE_USER_COUNT);
    assert.ok(users.users.some((u) => u.id === claims.sub));

    // 5. discovery stub cho issuer khớp token vừa cấp
    const disco = (await app.inject({ method: 'GET', url: '/api/auth/.well-known/openid-configuration' })).json();
    assert.equal(disco.issuer, claims.iss);
  } finally {
    await app.close();
  }
});
