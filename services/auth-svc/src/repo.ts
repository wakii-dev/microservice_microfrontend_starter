// repo.ts — bề mặt dữ liệu auth (interface). DrizzleAuthRepo = postgres thật;
// InMemoryAuthRepo (repo.test-support.ts) mirror semantics cho unit test.
// Điểm nóng nhất là rotateRefreshToken — CAS atomic 1 tx (token-contract.md §3).
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface AuthUserWithHash extends AuthUser {
  passwordHash: string;
}

export interface FixtureUser {
  id: string;
  email: string;
  roles: string[];
}

export interface NewUserInput {
  id: string;
  email: string; // đã normalize lowercase ở tầng route
  displayName: string;
  roles: string[];
  passwordHash: string;
}

export interface NewRefreshTokenInput {
  id: string;
  userId: string;
  tokenHash: string; // sha256 hex — DB không lưu raw
  expiresAt: Date;
}

export type RotateResult =
  | { status: 'ok'; userId: string } // CAS thắng — cặp mới đã INSERT trong cùng tx
  | { status: 'reuse' } // 0 rows (đã dùng/revoked/hết hạn) → đã revoke-all user
  | { status: 'unknown' }; // token lạ không có row — không biết user, không revoke gì

export interface AuthRepo {
  ping(): Promise<void>;
  listUsers(): Promise<FixtureUser[]>;
  getUserByEmail(email: string): Promise<AuthUserWithHash | null>;
  getUserById(id: string): Promise<AuthUser | null>;
  /** Email trùng → throw error có .code = '23505' (route map → 409 CONFLICT). */
  createUser(input: NewUserInput): Promise<AuthUser>;
  /** Seed idempotent — ON CONFLICT (id) DO NOTHING; true = insert mới. */
  insertUserIfAbsent(input: NewUserInput): Promise<boolean>;
  insertRefreshToken(input: NewRefreshTokenInput): Promise<void>;
  /**
   * Rotation CAS trong 1 tx (token-contract §3). `next` KHÔNG có userId —
   * repo tự fill từ row cũ (route chưa biết user khi nhận token opaque).
   * 'ok' trả userId để route sign access token mới.
   */
  rotateRefreshToken(oldTokenHash: string, next: Omit<NewRefreshTokenInput, 'userId'>): Promise<RotateResult>;
  /** Idempotent — token lạ/đã revoke = no-op (logout 204 không leak tồn tại). */
  revokeByTokenHash(tokenHash: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
