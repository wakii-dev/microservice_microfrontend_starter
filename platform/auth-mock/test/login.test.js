// Tests — node:test, không cần DB/dependency ngoài. Chạy: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import jwt from 'jsonwebtoken';
import { buildApp } from '../src/app.js';

// Fixture nhỏ riêng của test — không đọc fixture repo (test độc lập cwd)
function makeFixtureFile() {
  const dir = mkdtempSync(join(tmpdir(), 'auth-mock-test-'));
  const file = join(dir, 'users.json');
  writeFileSync(
    file,
    JSON.stringify({
      users: [
        { id: '11111111-1111-4111-8111-111111111111', email: 'alice@demo.local', roles: ['admin'] },
        { id: '22222222-2222-4222-8222-222222222222', email: 'bob@demo.local', roles: ['user'] },
      ],
    })
  );
  return { dir, file };
}

const SECRET = 'test-secret-at-least-32-chars-long!!';

test('login hợp lệ → 200 + JWT claims đúng theo token contract', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    const app = await buildApp({ usersFixturePath: file, jwtSecret: SECRET, devPassword: 'demo-password' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'demo-password' },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.tokenType, 'Bearer');
    assert.equal(body.expiresIn, 28800, 'TTL 8h — token-contract.md §1');
    const claims = jwt.verify(body.accessToken, SECRET, { algorithms: ['HS256'] });
    assert.equal(claims.sub, '11111111-1111-4111-8111-111111111111');
    assert.equal(claims.email, 'alice@demo.local');
    assert.deepEqual(claims.roles, ['admin']);
    assert.equal(claims.iss, 'auth-mock');
    assert.equal(claims.exp - claims.iat, 28800);
    await app.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('login sai password → 401 error envelope', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    const app = await buildApp({ usersFixturePath: file, jwtSecret: SECRET, devPassword: 'demo-password' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'alice@demo.local', password: 'wrong' },
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().error.code, 'UNAUTHORIZED');
    await app.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('login email không có trong fixture → 401 (không lộ tồn tại)', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    const app = await buildApp({ usersFixturePath: file, jwtSecret: SECRET, devPassword: 'demo-password' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'mallory@evil.local', password: 'demo-password' },
    });
    assert.equal(res.statusCode, 401);
    await app.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('payload thiếu field → 400 envelope', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    const app = await buildApp({ usersFixturePath: file, jwtSecret: SECRET, devPassword: 'demo-password' });
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'alice@demo.local' } });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error.code, 'VALIDATION_ERROR');
    await app.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('healthz/readyz 200 + fixture users endpoint', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    const app = await buildApp({ usersFixturePath: file, jwtSecret: SECRET, devPassword: 'demo-password' });
    assert.equal((await app.inject({ method: 'GET', url: '/healthz' })).statusCode, 200);
    assert.equal((await app.inject({ method: 'GET', url: '/readyz' })).statusCode, 200);
    const users = (await app.inject({ method: 'GET', url: '/api/auth/users' })).json();
    assert.equal(users.users.length, 2);
    assert.equal(users.users[0].email, 'alice@demo.local');
    await app.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('discovery stub trả issuer + token endpoint', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    const app = await buildApp({ usersFixturePath: file, jwtSecret: SECRET, devPassword: 'demo-password' });
    const res = await app.inject({ method: 'GET', url: '/api/auth/.well-known/openid-configuration' });
    assert.equal(res.statusCode, 200);
    const doc = res.json();
    assert.equal(doc.issuer, 'auth-mock');
    assert.match(doc.token_endpoint, /\/api\/auth\/login$/);
    await app.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('thiếu JWT_SECRET → fail-fast khi boot (conventions/06)', async () => {
  const { dir, file } = makeFixtureFile();
  try {
    await assert.rejects(
      () => buildApp({ usersFixturePath: file, jwtSecret: undefined, devPassword: 'x' }),
      /JWT_SECRET/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
