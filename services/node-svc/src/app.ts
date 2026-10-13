// app.ts — Fastify assembly: CORS dev-profile (conventions/07), swagger UI
// (mirror tối thiểu tasks.yaml — pattern auth-mock), error envelope chung
// (conventions/04), JSON log shape (conventions/03), health naked + mirror,
// CRUD /api/tasks. Tất cả dependency inject qua opts → unit test không cần
// postgres/spring/go thật.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyBaseLogger, type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { SpringClient } from './clients/spring.js';
import { nodeSvcLogger } from './logger.js';
import type { Env } from './env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerTaskRoutes } from './routes/tasks.js';
import type { TaskRepo } from './repo.js';

export interface AppDeps {
  env: Env;
  repo: TaskRepo;
  spring: SpringClient;
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const { env, repo, spring } = deps;
  const logger = nodeSvcLogger(env.logLevel);

  const app = Fastify({
    // pino ≥9.14 Logger type ≠ FastifyBaseLogger (msgPrefix) — cast giao diện
    // log, instance vẫn là pino shape conventions/03.
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
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });

  // Swagger UI — mirror tối thiểu của contracts/openapi/tasks.yaml (spec §11).
  // Native: http://localhost:3001/api/tasks/docs. Qua gateway cần Bearer.
  void app.register(swagger, {
    openapi: {
      info: {
        title: 'Tasks API (node-svc)',
        version: '0.1.0',
        description:
          'Task CRUD — source of truth: contracts/openapi/tasks.yaml. Bản dưới đây là mirror tối thiểu cho swagger UI.',
      },
      servers: [{ url: '/api/tasks' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  void app.register(swaggerUi, { routePrefix: '/api/tasks/docs' });

  // Error envelope chung (conventions/04) — map mọi error, kể cả FST_ERR_*.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const isValidation = Array.isArray(err.validation);
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : isValidation ? 400 : 500;
    request.log[status >= 500 ? 'error' : 'warn']({ err: err.message }, 'request failed');
    reply.status(status).send({
      error: {
        // FST_ERR_VALIDATION → VALIDATION_ERROR (envelope chung, conventions/04)
        code: isValidation
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

  // Health: naked (compose healthcheck + boot-smoke) + mirror /api/tasks/*.
  registerHealthRoutes(app, repo);
  app.register(
    async (scope) => {
      registerHealthRoutes(scope, repo);
    },
    { prefix: '/api/tasks' },
  );

  // CRUD /api/tasks — auth guard mount trong plugin (health exempt nằm ngoài).
  app.register(
    async (scope) => {
      registerTaskRoutes(scope, {
        repo,
        spring,
        jwtSecret: env.jwtSecret,
        log: (level, msg, fields) => logger[level](fields ?? {}, msg),
      });
    },
    { prefix: '/api/tasks' },
  );

  return app;
}

/** Đường dẫn thư mục migration — đúng cho tsx (src/), dist/ và Docker /app/dist. */
export function migrationsFolder(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../drizzle');
}
