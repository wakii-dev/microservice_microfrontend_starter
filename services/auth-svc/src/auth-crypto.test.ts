// auth-crypto.test.ts — primitives: argon2id roundtrip (token-contract §1) +
// sha256-at-rest + opaque 256-bit refresh (token-contract §2).
import { describe, expect, it } from 'vitest';
import { verify } from '@node-rs/argon2';
import { hashPassword, newRefreshToken, sha256Hex } from './auth-crypto.js';

describe('auth-crypto', () => {
  it('hashPassword = argon2id; verify đúng password true / sai false', async () => {
    const hash = await hashPassword('demo-password');
    expect(hash.startsWith('$argon2id$')).toBe(true); // algorithm BẮT BUỘC argon2id
    expect(await verify(hash, 'demo-password')).toBe(true);
    expect(await verify(hash, 'demo-password ')).toBe(false);
  });

  it('sha256Hex deterministic 64 hex — DB chỉ lưu hash, không raw (token-contract §2)', () => {
    expect(sha256Hex('abc')).toHaveLength(64);
    expect(sha256Hex('abc')).toBe(sha256Hex('abc'));
    expect(sha256Hex('abc')).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex('abc')).not.toBe(sha256Hex('abd'));
  });

  it('newRefreshToken: opaque 256-bit base64url (~43 chars), KHÔNG phải JWT, unique', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const t = newRefreshToken();
      expect(t).not.toContain('.'); // không phải JWT
      expect(t.length).toBeGreaterThanOrEqual(40);
      tokens.add(t);
    }
    expect(tokens.size).toBe(20); // 20 lần sinh → 20 token khác nhau
  });
});
