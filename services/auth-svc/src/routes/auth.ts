// auth.ts — 5 endpoints + GET /users (contracts/openapi/auth.yaml v2 +
// contracts/auth/token-contract.md v2 — ĐỌC CÙNG, 2 file là một hiệp ước):
//   POST /register  201 AuthSession {user, accessToken, refreshToken} | 409
//   POST /login     200 AuthSession | 401 (message chung, không lộ user tồn tại)
//   POST /refresh   200 TokenPair (rotation CAS §3) | 401 reuse/hết hạn/lạ
//   POST /logout    204 idempotent
//   POST /logout-all 204 (Bearer bắt buộc) — revoke tất cả của sub
//   GET  /users     200 {users:[{id,email,roles}]} — serve từ schema auth (giữ v1)
// KHÔNG log password/refreshToken (logger redact + không đưa vào log call).
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { REFRESH_TTL_MS, hashPassword, newRefreshToken, sha256Hex, verifyPassword } from '../auth-crypto.js';
import { JWT_ISSUER, requireBearer } from '../plugins/auth.js';
import type { AuthRepo, AuthUser, NewUserInput } from '../repo.js';

// HttpError — envelope handler của app đọc statusCode + code (mirror node-svc).
export class HttpError extends Error {
  // statusCode (không phải status) — tên fastify error handler đọc
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

// Dummy hash cho timing equalization khi email lạ — verify THẬT vào 1 hash
// argon2id huyền thoại để thời gian phản hồi 401 không phân biệt email tồn tại.
const DUMMY_HASH: string = await hashPassword(`dummy-${randomUUID()}`);

const emailSchema = { type: 'string', format: 'email' } as const;

const registerBodySchema = {
  type: 'object',
  required: ['email', 'password', 'displayName'],
  properties: {
    email: emailSchema,
    password: { type: 'string', minLength: 8, maxLength: 72 }, // argon2 input limit — auth.yaml
    displayName: { type: 'string', minLength: 1 },
  },
} as const;

const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: { email: emailSchema, password: { type: 'string', minLength: 1 } },
} as const;

const refreshBodySchema = {
  type: 'object',
  required: ['refreshToken'],
  properties: { refreshToken: { type: 'string', minLength: 1 } },
} as const;

interface Deps {
  repo: AuthRepo;
  jwtSecret: string;
  accessTokenTtl: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function signAccessToken(user: AuthUser, jwtSecret: string, ttl: string): string {
  // claims giữ nguyên shape v1 — iss LITERAL "auth-mock" PINNED (token-contract §1)
  return jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles, iss: JWT_ISSUER },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: ttl as jwt.SignOptions['expiresIn'] }, // '30m' — env đã validate format
  );
}

function toPublicUser(user: AuthUser): { id: string; email: string; displayName: string; roles: string[] } {
  return { id: user.id, email: user.email, displayName: user.displayName, roles: user.roles };
}

export function registerAuthRoutes(app: FastifyInstance, deps: Deps): void {
  const { repo, jwtSecret, accessTokenTtl } = deps;

  // Cấp session: sign access + INSERT refresh token (sha256-at-rest, TTL 7d)
  const issueSession = async (user: AuthUser) => {
    const refreshToken = newRefreshToken();
    await repo.insertRefreshToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash: sha256Hex(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    return { user: toPublicUser(user), accessToken: signAccessToken(user, jwtSecret, accessTokenTtl), refreshToken };
  };

  // ---- register (auth.yaml v2 — 201, đăng nhập luôn sau khi tạo) ----
  app.post(
    '/register',
    { schema: { body: registerBodySchema } },
    async (request, reply) => {
      const body = request.body as { email: string; password: string; displayName: string };
      const input: NewUserInput = {
        id: randomUUID(),
        email: normalizeEmail(body.email), // lưu lowercase-normalized — auth.yaml description
        displayName: body.displayName,
        roles: ['user'], // register luôn gán ["user"] — spec §Register
        passwordHash: await hashPassword(body.password),
      };
      let created: AuthUser;
      try {
        created = await repo.createUser(input);
      } catch (err) {
        if ((err as { code?: string }).code === '23505') {
          // race-safe: UNIQUE violation → 409 (không leak nhiều hơn cần)
          throw new HttpError(409, 'CONFLICT', 'Email đã tồn tại');
        }
        throw err;
      }
      const session = await issueSession(created);
      reply.status(201);
      return session;
    },
  );

  // ---- login ----
  app.post(
    '/login',
    { schema: { body: loginBodySchema } },
    async (request) => {
      const body = request.body as { email: string; password: string };
      const user = await repo.getUserByEmail(normalizeEmail(body.email));
      // Verify THẬT kể cả khi user lạ (dummy hash) — 401 không phân biệt nguyên
      // nhân, không rò sự tồn tại email qua timing (message chung auth-mock v1).
      const passwordOk = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, body.password);
      if (!user || !passwordOk) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Invalid credentials');
      }
      return issueSession(user);
    },
  );

  // ---- refresh (rotation CAS + reuse-detect — token-contract §3) ----
  app.post(
    '/refresh',
    { schema: { body: refreshBodySchema } },
    async (request) => {
      const { refreshToken } = request.body as { refreshToken: string };
      // Sinh raw token mới TRƯỚC — route giữ raw để trả client, repo chỉ thấy
      // hash (DB không bao giờ chứa raw — token-contract §2).
      const nextRaw = newRefreshToken();
      const result = await repo.rotateRefreshToken(sha256Hex(refreshToken), {
        id: randomUUID(),
        tokenHash: sha256Hex(nextRaw),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      });
      if (result.status === 'unknown') {
        // Token lạ (không row) — chỉ 401, không revoke gì, không biết user
        throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
      }
      if (result.status === 'reuse') {
        // Strict — mọi session của user vừa bị revoke, client phải login lại
        throw new HttpError(401, 'UNAUTHORIZED', 'Refresh token reuse detected — all sessions revoked');
      }
      const user = await repo.getUserById(result.userId);
      if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
      return { accessToken: signAccessToken(user, jwtSecret, accessTokenTtl), refreshToken: nextRaw };
    },
  );

  // ---- logout (204 idempotent — token lạ/đã revoke vẫn 204, không leak) ----
  app.post('/logout', { schema: { body: refreshBodySchema } }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    await repo.revokeByTokenHash(sha256Hex(refreshToken));
    reply.status(204);
    return null;
  });

  // ---- logout-all (Bearer bắt buộc — verify iss literal PINNED) ----
  app.post(
    '/logout-all',
    { preHandler: requireBearer(jwtSecret) },
    async (request, reply) => {
      await repo.revokeAllForUser(request.user!.sub);
      reply.status(204);
      return null;
    },
  );

  // ---- users (giữ v1 — danh sách demo cho FE picker, serve từ schema auth) ----
  app.get('/users', async () => {
    return { users: await repo.listUsers() };
  });
}
