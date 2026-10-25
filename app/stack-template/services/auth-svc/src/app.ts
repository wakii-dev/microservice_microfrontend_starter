// app.ts — Fastify assembly (mirror node-svc): CORS dev-profile (conventions/07),
// error envelope chung (conventions/04 — HttpError.statusCode, pino cast —
// improvements-log 2026-10-12), JSON log shape (conventions/03), health naked +
// mirror, 5 auth endpoints + GET /users dưới prefix /api/auth (auth.yaml
// servers.url). Dependency inject qua opts → unit test không cần postgres.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyBaseLogger, type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { Env } from './env.js';
import { authSvcLogger } from './logger.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerAuthRoutes } from './routes/auth.js';
import type { AuthRepo } from './repo.js';

export interface AppDeps {
  env: Env;
  repo: AuthRepo;
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const { env, repo } = deps;
  const logger = authSvcLogger(env.logLevel);

  const app = Fastify({
    // pino ≥9.14 Logger type ≠ FastifyBaseLogger (msgPrefix) — cast giao diện
    // log, instance vẫn là pino shape conventions/03 (improvements-log 2026-10-12).
    loggerInstance: logger as unknown as FastifyBaseLogger,
    genReqId: (req) => {
      // X-Request-Id từ gateway (conventions/03) — trace xuyên gateway → service
      const header = req.headers['x-request-id'];
      return typeof header === 'string' && header.length > 0 ? header : crypto.randomUUID();
    },
    bodyLimit: 64 * 1024,
  });

  // CORS dev-profile — conventions/07: origin từ CORS_DEV_ORIGIN (phẩy);
  // rỗng (compose/prod) → origin:false = KHÔNG emit ACAO (deny-by-default).
  const devOrigins = env.corsDevOrigin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  void app.register(cors, {
    origin: devOrigins.length > 0 ? devOrigins : false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });

  // Error envelope chung (conventions/04) — map mọi error, kể cả FST_ERR_*.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const isValidation = Array.isArray(err.validation);
    // FST_ERR_CTP_* (body JSON không parse được) = payload sai schema →
    // VALIDATION_ERROR (conventions/04 rule 1 — framework error phải map code).
    const isBadPayload = typeof err.code === 'string' && err.code.startsWith('FST_ERR_CTP');
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : isValidation ? 400 : 500;
    request.log[status >= 500 ? 'error' : 'warn']({ err: err.message }, 'request failed');
    reply.status(status).send({
      error: {
        // HttpError.code (CONFLICT/UNAUTHORIZED/…) hoặc FST_ERR_VALIDATION /
        // FST_ERR_CTP_* → VALIDATION_ERROR (envelope chung, conventions/04)
        code: isValidation || isBadPayload
          ? 'VALIDATION_ERROR'
          : (err.code ?? (status === 401 ? 'UNAUTHORIZED' : status === 404 ? 'NOT_FOUND' : 'INTERNAL')),
        message: status >= 500 ? 'Internal error' : err.message,
        requestId: request.id,
        details: status >= 500 ? null : (err.validation ?? null),
      },
    });
  });

  // 404 ngoài route — cùng envelope (NOT_FOUND).
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} không tồn tại`, requestId: request.id, details: null },
    });
  });

  // Health: naked (compose healthcheck + boot-smoke) + mirror /api/auth/*
  // (auth.yaml servers.url + schemathesis — conventions/02 rule 6). Không-auth.
  registerHealthRoutes(app, repo);
  app.register(
    async (scope) => {
      registerHealthRoutes(scope, repo);
    },
    { prefix: '/api/auth' },
  );

  // 5 auth endpoints + GET /users dưới prefix /api/auth (gateway pass-through —
  // gateway KHÔNG chặn thiếu-token trên /api/auth; logout-all tự verify Bearer).
  app.register(
    async (scope) => {
      registerAuthRoutes(scope, { repo, jwtSecret: env.jwtSecret, accessTokenTtl: env.accessTokenTtl });
    },
    { prefix: '/api/auth' },
  );

  return app;
}

/** Đường dẫn thư mục migration — đúng cho tsx (src/), dist/ và Docker /app/dist. */
export function migrationsFolder(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../drizzle');
}
