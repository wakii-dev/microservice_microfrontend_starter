// env.test.ts — fail-fast env (conventions/06): thiếu bắt buộc = throw liệt kê
// tên biến; ACCESS_TOKEN_TTL phải là duration hợp lệ (jsonwebtoken parse);
// AUTH_DEV_PASSWORD default 'demo-password' (spec decision #10).
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const BASE = {
  DATABASE_URL: 'postgres://boilerplate:x@localhost:5432/boilerplate',
  JWT_SECRET: 'test-secret-at-least-32-characters!!',
  ACCESS_TOKEN_TTL: '30m',
};

describe('loadEnv (auth-svc)', () => {
  it('thiếu env bắt buộc → throw liệt kê tên biến (conventions/06 rule 6)', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL.*JWT_SECRET.*ACCESS_TOKEN_TTL/s);
  });

  it('đủ env → parse đúng; PORT default 8090 (conventions/05); LOG_LEVEL default info', () => {
    const env = loadEnv({ ...BASE });
    expect(env.port).toBe(8090);
    expect(env.databaseUrl).toBe(BASE.DATABASE_URL);
    expect(env.jwtSecret).toBe(BASE.JWT_SECRET);
    expect(env.accessTokenTtl).toBe('30m');
    expect(env.logLevel).toBe('info');
  });

  it('AUTH_DEV_PASSWORD default demo-password (decision #10); USERS_FIXTURE_PATH optional → null', () => {
    const env = loadEnv({ ...BASE });
    expect(env.authDevPassword).toBe('demo-password');
    expect(env.usersFixturePath).toBeNull();
    const withFixture = loadEnv({
      ...BASE,
      AUTH_DEV_PASSWORD: 'other-dev-pass',
      USERS_FIXTURE_PATH: '/app/users.json',
    });
    expect(withFixture.authDevPassword).toBe('other-dev-pass');
    expect(withFixture.usersFixturePath).toBe('/app/users.json');
  });

  it('ACCESS_TOKEN_TTL sai format → throw (không để jsonwebtoken nổ giữa request)', () => {
    expect(() => loadEnv({ ...BASE, ACCESS_TOKEN_TTL: 'banana' })).toThrow(/ACCESS_TOKEN_TTL/);
    expect(() => loadEnv({ ...BASE, ACCESS_TOKEN_TTL: '' })).toThrow(/ACCESS_TOKEN_TTL/);
    // các unit hợp lệ (giây/phút/giờ/ngày — token-contract §1 dùng m)
    expect(() => loadEnv({ ...BASE, ACCESS_TOKEN_TTL: '1800s' })).not.toThrow();
    expect(() => loadEnv({ ...BASE, ACCESS_TOKEN_TTL: '1h' })).not.toThrow();
  });

  it('PORT invalid → throw nhắc conventions/05 (auth-svc = 8090)', () => {
    expect(() => loadEnv({ ...BASE, PORT: 'nope' })).toThrow(/PORT/);
  });

  it('LOG_LEVEL ngoài 4 giá trị → throw', () => {
    expect(() => loadEnv({ ...BASE, LOG_LEVEL: 'loud' })).toThrow(/LOG_LEVEL/);
  });
});
