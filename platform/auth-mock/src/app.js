// auth-mock — mock JWT service theo contracts/auth/token-contract.md
// ⚠️ NOT FOR PRODUCTION. SF-1 (FI-64) sở hữu.
//
// Routes mount dưới prefix /api/auth (gateway pass-through — conventions/08),
// RIỆNG /healthz + /readyz ở naked path cho compose healthcheck + boot-smoke.
import path from 'node:path';
import { readFileSync } from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from 'jsonwebtoken';
import { authMockLogger } from './logger.js';
import { registerRoutes } from './routes.js';

const TTL_SECONDS = 28800; // 8h — token-contract.md §1
const ISSUER = 'auth-mock';

export function loadUsers(fixturePath) {
  const raw = JSON.parse(readFileSync(fixturePath, 'utf8'));
  const users = Array.isArray(raw) ? raw : raw.users;
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error(`users fixture invalid: ${fixturePath}`);
  }
  for (const u of users) {
    if (!u.id || !u.email || !Array.isArray(u.roles)) {
      throw new Error(`users fixture entry missing id/email/roles: ${JSON.stringify(u)}`);
    }
  }
  return users;
}

export async function buildApp(opts = {}) {
  const fixturePath =
    opts.usersFixturePath ?? process.env.USERS_FIXTURE_PATH ?? '../../contracts/auth/users.json';
  const jwtSecret = opts.jwtSecret ?? process.env.JWT_SECRET;
  const devPassword = opts.devPassword ?? process.env.AUTH_MOCK_DEV_PASSWORD ?? 'demo-password';

  if (!jwtSecret) {
    // fail-fast — không fallback secret (conventions/06 rule 6)
    throw new Error('JWT_SECRET is required (token-contract.md §2)');
  }
  const users = loadUsers(path.resolve(fixturePath));

  const app = Fastify({
    loggerInstance: authMockLogger(), // Fastify v5: instance qua loggerInstance, options qua logger
    // /healthz + /readyz không cần body parsing phức tạp — tắt cho nhanh
    bodyLimit: 64 * 1024,
  });

  // CORS dev-profile — conventions/07: auth-mock luôn mở cho dev origin
  // (native FE dev gọi thẳng :8090 không qua gateway). Prod: origin rỗng → deny-by-default.
  const devOrigins = (opts.corsDevOrigin ?? process.env.CORS_DEV_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await app.register(cors, { origin: devOrigins });

  await app.register(swagger, {
    openapi: {
      // spec source of truth: contracts/openapi/auth.yaml — bản dưới đây là
      // mirror tối thiểu chỉ để swagger UI hiển thị 3 endpoint mock.
      info: {
        title: 'Auth API (auth-mock) — NOT FOR PRODUCTION',
        version: '0.1.0',
        description:
          '⚠️ Mock JWT service cho boilerplate demo. Token contract: contracts/auth/token-contract.md. Điểm cắm OIDC thật khi copy dự án.',
      },
      servers: [{ url: '/api/auth' }],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/api/auth/docs', // qua gateway: http://localhost:8080/api/auth/docs
  });

  // Error envelope chung (conventions/04) — mọi error fastify đi qua đây
  app.setErrorHandler((err, request, reply) => {
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    request.log[status >= 500 ? 'error' : 'warn']({ err }, 'request failed');
    reply.status(status).send({
      error: {
        code: err.code ?? (status === 400 ? 'VALIDATION_ERROR' : status === 401 ? 'UNAUTHORIZED' : 'INTERNAL'),
        message: status >= 500 ? 'Internal error' : err.message,
        requestId: request.id,
        details: status >= 500 ? null : err.validation ?? null,
      },
    });
  });

  registerRoutes(app, { users, jwtSecret, devPassword, ttlSeconds: TTL_SECONDS, issuer: ISSUER });

  return app;
}

export { TTL_SECONDS, ISSUER };
