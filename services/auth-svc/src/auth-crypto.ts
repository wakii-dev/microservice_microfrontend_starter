// auth-crypto.ts — primitives mật mã (token-contract.md §1–2):
// - password: argon2id (tham số mặc định @node-rs/argon2 = OWASP: 19MiB/t=1/p=1…)
// - refresh token: opaque 256-bit random base64url, DB chỉ lưu sha256 hex —
//   KHÔNG BAO GIỜ lưu raw (leak DB không dựng lại token được).
import { Algorithm, hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';

export function hashPassword(password: string): Promise<string> {
  // Argon2id — contract pin thuật toán này (auth.yaml RegisterRequest description)
  return hash(password, { algorithm: Algorithm.Argon2id });
}

export function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  return verify(storedHash, password);
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function newRefreshToken(): string {
  return randomBytes(32).toString('base64url'); // 256-bit entropy — token-contract §2
}

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày — tầng contract, không env
