// repo.drizzle.ts — DrizzleAuthRepo: postgres thật. ĐIỂM NÓNG = rotateRefresh
// Token — CAS atomic TRONG 1 TRANSACTION (token-contract.md §3 + review SF-1
// c2bd165: INSERT token mới CÙNG tx với CAS UPDATE — trượt bước nào rollback
// cả hai, không bao giờ có trạng thái "đã revoke cũ nhưng chưa có cặp mới").
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { refreshTokens, users } from './db/schema.js';
import type {
  AuthRepo,
  AuthUser,
  AuthUserWithHash,
  FixtureUser,
  NewRefreshTokenInput,
  NewUserInput,
  RotateResult,
} from './repo.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Executor = NodePgDatabase | any; // NodePgDatabase | tx (cùng bề mặt query)

export class DrizzleAuthRepo implements AuthRepo {
  constructor(private readonly db: NodePgDatabase) {}

  async ping(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }

  async listUsers(): Promise<FixtureUser[]> {
    const rows = await this.db
      .select({ id: users.id, email: users.email, roles: users.roles })
      .from(users)
      .orderBy(asc(users.createdAt), asc(users.id));
    return rows;
  }

  async getUserByEmail(email: string): Promise<AuthUserWithHash | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    return rows[0] ? this.toUserWithHash(rows[0]) : null;
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const u = rows[0];
    return u ? { id: u.id, email: u.email, displayName: u.displayName, roles: u.roles } : null;
  }

  async createUser(input: NewUserInput): Promise<AuthUser> {
    // Email UNIQUE chặn race 2 register đồng thời. drizzle-orm ≥0.44 bọc PG
    // error trong DrizzleQueryError (code nằm ở .cause.code) — normalize lại
    // để giữ đúng contract AuthRepo: throw error có .code = '23505'.
    try {
      const rows = await this.db
        .insert(users)
        .values({ ...input, roles: [...input.roles] })
        .returning({ id: users.id, email: users.email, displayName: users.displayName, roles: users.roles });
      return rows[0];
    } catch (err) {
      const code = (err as { code?: string }).code ?? (err as { cause?: { code?: string } }).cause?.code;
      if (code === '23505') {
        const dup = new Error('duplicate key value violates unique constraint "users_email_unique"') as Error & { code: string };
        dup.code = '23505';
        throw dup;
      }
      throw err;
    }
  }

  async insertUserIfAbsent(input: NewUserInput): Promise<boolean> {
    const rows = await this.db
      .insert(users)
      .values({ ...input, roles: [...input.roles] })
      .onConflictDoNothing({ target: users.id })
      .returning({ id: users.id });
    return rows.length > 0;
  }

  async insertRefreshToken(input: NewRefreshTokenInput): Promise<void> {
    await this.db.insert(refreshTokens).values(input);
  }

  // Rotation CAS — chạy trong 1 tx: SELECT row cũ theo token_hash → CAS UPDATE
  // (revoked_at IS NULL AND expires_at > now() — enforce TTL 7d) → thắng:
  // INSERT token mới cùng tx; thua 0-rows: reuse-detect → revoke-all user rồi
  // COMMIT (revoke-all phải được giữ lại — không rollback nhánh này).
  async rotateRefreshToken(oldTokenHash: string, next: Omit<NewRefreshTokenInput, 'userId'>): Promise<RotateResult> {
    return this.db.transaction(async (tx): Promise<RotateResult> => {
      const found = await tx
        .select({ id: refreshTokens.id, userId: refreshTokens.userId })
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, oldTokenHash))
        .limit(1);
      const old = found[0];
      if (!old) return { status: 'unknown' }; // token lạ — không biết user, không revoke gì

      const cas = await tx
        .update(refreshTokens)
        .set({ revokedAt: sql`now()`, replacedBy: next.id })
        .where(
          and(
            eq(refreshTokens.id, old.id),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, sql`now()`),
          ),
        )
        .returning({ id: refreshTokens.id });

      if (cas.length === 0) {
        // reuse-detect strict — revoke TẤT CẢ refresh token của user (§3)
        await tx
          .update(refreshTokens)
          .set({ revokedAt: sql`now()` })
          .where(and(eq(refreshTokens.userId, old.userId), isNull(refreshTokens.revokedAt)));
        return { status: 'reuse' };
      }

      await tx.insert(refreshTokens).values({ ...next, userId: old.userId }); // cùng tx với CAS — atomic
      return { status: 'ok', userId: old.userId };
    });
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    // Idempotent: đã revoked/không tồn tại = 0 rows updated — logout vẫn 204
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: sql`now()` })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: sql`now()` })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toUserWithHash(row: any): AuthUserWithHash {
    return { id: row.id, email: row.email, displayName: row.displayName, roles: row.roles, passwordHash: row.passwordHash };
  }
}
