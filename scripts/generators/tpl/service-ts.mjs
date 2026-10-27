// service-ts.mjs — template Fastify+TS service (mặc định gen-service).
// Mỗi file sinh ra ĐÃ theo conventions: 01 Dockerfile multi-stage (healthcheck
// KHÔNG khai ở Dockerfile), 02 health naked+mirror, 03 pino JSON, 04 error
// envelope, 05 port qua env PORT, 06 env fail-fast, 07 CORS dev-profile,
// 08 route dưới prefix /api/<name> + tự verify JWT.
// ctx: { name, camel, pascal, scream, port, db }.

function pkg(ctx) {
  const deps = {
    '@fastify/cors': '^11.0.0',
    fastify: '^5.2.0',
    jsonwebtoken: '^9.0.2',
    pino: '^9.6.0',
  };
  const devDeps = {
    '@types/jsonwebtoken': '^9.0.10',
    '@types/node': '^22.0.0',
    'openapi-typescript': '^7.8.0',
    tsx: '^4.20.0',
    typescript: '^5.8.0',
    vitest: '^3.2.0',
  };
  if (ctx.db) {
    deps.pg = '^8.16.0';
    devDeps['@types/pg'] = '^8.15.0';
  }
  return {
    name: ctx.name,
    version: '0.1.0',
    private: true,
    description:
      ctx.pascal + ' API — Fastify + TS. Sinh bởi scripts/generators gen-service. Contract: contracts/openapi/' + ctx.name + '.yaml.',
    type: 'module',
    engines: { node: '>=22' },
    packageManager: 'pnpm@9.15.9',
    scripts: {
      build: 'tsc -p tsconfig.json',
      dev: 'tsx watch src/server.ts',
      start: 'node dist/server.js',
      test: 'vitest run',
      'generate:types': 'openapi-typescript ../../contracts/openapi/' + ctx.name + '.yaml -o src/types/api.d.ts',
    },
    dependencies: deps,
    devDependencies: devDeps,
  };
}

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
`;

const vitestConfig = `// vitest — engine test Node thuần (không DOM, không network thật).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
`;

function dockerfile(ctx) {
  return (
    `# ` + ctx.name + ` — multi-stage theo platform/conventions/01-dockerfile-pattern.md.
# Lockfile: LOCAL pnpm-lock.yaml (thư mục này, pnpm install --ignore-workspace) vì
# build context = services/` + ctx.name + ` — root workspace lockfile ngoài context.
# Healthcheck KHÔNG khai ở đây (conventions/01 rule 4) — một nguồn duy nhất:
# platform/docker-compose.yml.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm exec tsc -p tsconfig.json

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE ` + ctx.port + `
CMD ["node", "dist/server.js"]
`
  );
}

function envTs(ctx) {
  const dbLine = ctx.db
    ? `  const dbUrl = need('DATABASE_URL');\n`
    : `  // thêm DATABASE_URL (bắt buộc, fail-fast) ngay khi service có DB — conventions/06.\n`;
  const dbField = ctx.db ? `  dbUrl,\n` : `  dbUrl: null,\n`;
  return (
    `// env.ts — parse + fail-fast env config (conventions/06: 100% env-var, secret
// không fallback im lặng). Sinh bởi scripts/generators gen-service.
export interface Env {
  port: number;
  jwtSecret: string;
  corsDevOrigin: string; // rỗng = deny-by-default (conventions/07)
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dbUrl: ` +
    (ctx.db ? 'string' : 'string | null') +
    `;
}

const LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing: string[] = [];
  const need = (name: string): string => {
    const v = source[name];
    if (!v || v.trim() === '') missing.push(name);
    return v ?? '';
  };

  const port = Number(need('PORT') || '` +
    ctx.port +
    `');
  const jwtSecret = need('JWT_SECRET');
` +
    dbLine +
    `  const logLevelRaw = source.LOG_LEVEL ?? 'info';

  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT invalid: "' + source.PORT + '" (conventions/05: ` +
    ctx.name +
    ` = ` +
    ctx.port +
    `)');
  }
  if (!LEVELS.includes(logLevelRaw as Env['logLevel'])) {
    throw new Error('LOG_LEVEL invalid: "' + logLevelRaw + '" (debug|info|warn|error)');
  }
  if (missing.length > 0) {
    throw new Error('Missing required env vars: ' + missing.join(', ') + ' (platform/.env.example)');
  }

  return {
    port,
    jwtSecret,
    corsDevOrigin: source.CORS_DEV_ORIGIN ?? '',
    logLevel: logLevelRaw as Env['logLevel'],
` +
    dbField +
    `  };
}
`
  );
}

const loggerTs = (ctx) =>
  `// logger.ts — pino JSON shape chung (conventions/03): ts ISO-8601 UTC ms,
// level, service, msg, requestId. Không console.log — mọi log qua đây.
import pino from 'pino';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function ` +
  ctx.camel +
  `Logger(level: LogLevel = 'info'): pino.Logger {
  return pino({
    level,
    base: { service: '` +
  ctx.name +
  `' },
    timestamp: () => ',"ts":"' + new Date().toISOString() + '"',
    // conventions/03: không log JWT/password toàn phần
    redact: {
      paths: ['authorization', 'req.headers.authorization', 'password', '*.password', 'token', '*.token'],
      censor: '[REDACTED]',
    },
  });
}
`;

const authTs = () =>
  `// auth.ts — service TỰ verify JWT HS256 (signature + expiry). Gateway chỉ làm
// presence-check — verify thật là việc của service (conventions/08 rule 4,
// contracts/auth/token-contract.md §4). Sinh bởi gen-service.
import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  sub: string;
  email: string;
  roles: string[];
}

export function verifyJwt(token: string, secret: string): AuthUser {
  const payload = jwt.verify(token, secret) as Record<string, unknown>;
  return {
    sub: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
    roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
  };
}

function unauthorized(reply: FastifyReply, requestId: string, message: string): void {
  reply.status(401).send({
    error: { code: 'UNAUTHORIZED', message, requestId, details: null },
  });
}

/** preHandler guard — thiếu/sai/hết hạn token → 401 envelope (conventions/04). */
export function requireAuth(secret: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      unauthorized(reply, request.id, 'Missing Authorization header');
      return;
    }
    try {
      verifyJwt(token, secret);
    } catch {
      unauthorized(reply, request.id, 'Invalid or expired token');
    }
  };
}
`;

function healthTs(ctx) {
  return (
    `// health.ts — /healthz (liveness) + /readyz (readiness), conventions/02.
// Đăng ký 2 LẦN: naked path (compose healthcheck + CI boot-smoke — gateway
// KHÔNG route path này) và mirror /api/` +
    ctx.name +
    `/* (rule 6 — OpenAPI servers.url có
// prefix nên contract test cần mirror). CẢ HAI không-auth.
// readyz = ready.check() THẬT — khi service thêm dep (DB/API khác) phải kiểm
// dep thật ở đó, không được hardcode 200 (conventions/02 rule 2).
import type { FastifyInstance } from 'fastify';

export interface Ready {
  /** Throw khi chưa sẵn sàng → readyz map sang 503 envelope DEPENDENCY_DOWN. */
  check: () => Promise<void>;
}

function ok(): { status: 'ok' } {
  return { status: 'ok' };
}

export function registerHealthRoutes(app: FastifyInstance, ready: Ready): void {
  app.get('/healthz', async () => ok());

  app.get('/readyz', async (_request, reply) => {
    try {
      await ready.check();
      return ok();
    } catch (err) {
      reply.status(503);
      return {
        error: {
          code: 'DEPENDENCY_DOWN',
          message: 'not ready' + (err instanceof Error ? ': ' + err.message : ''),
          requestId: null,
          details: null,
        },
      };
    }
  });
}
`
  );
}

function itemsTs(ctx) {
  return (
    `// items.ts — SAMPLE resource chứng minh đủ conventions: route dưới prefix
// /api/` +
    ctx.name +
    `, JWT guard, JSON-schema validation → 400 VALIDATION_ERROR, list shape
// {items,total} (pattern contracts/openapi/*.yaml). THAY bằng domain thật:
// sửa contracts/openapi/` +
    ctx.name +
    `.yaml TRƯỚC rồi code theo sau (nguyên tắc vàng — contract-first).
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';

export interface Item {
  id: string;
  name: string;
  createdAt: string;
}

export function registerItemRoutes(app: FastifyInstance, opts: { jwtSecret: string; store: Map<string, Item> }): void {
  const guard = requireAuth(opts.jwtSecret);

  app.get(
    '/items',
    {
      preHandler: [guard],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as { limit: number; offset: number };
      const all = [...opts.store.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { items: all.slice(q.offset, q.offset + q.limit), total: all.length };
    },
  );

  app.post(
    '/items',
    {
      preHandler: [guard],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1, maxLength: 200 } },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { name: string };
      const item: Item = { id: crypto.randomUUID(), name: body.name, createdAt: new Date().toISOString() };
      opts.store.set(item.id, item);
      reply.status(201);
      return item;
    },
  );
}
`
  );
}

function appTs(ctx) {
  return (
    `// app.ts — Fastify assembly: CORS dev-profile (conventions/07), error envelope
// chung (conventions/04), JSON log (conventions/03), health naked + mirror
// (conventions/02 rule 6), SAMPLE /items dưới prefix /api/` +
    ctx.name +
    `.
// Dependency inject qua opts → unit test không cần DB/network thật. Sinh bởi gen-service.
import Fastify, { type FastifyBaseLogger, type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { Env } from './env.js';
import { ` +
    ctx.camel +
    `Logger } from './logger.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerItemRoutes, type Item } from './routes/items.js';

export interface AppDeps {
  env: Env;
  /** readiness check — mặc định no-op; khi service có DB/deps → kiểm THẬT (conventions/02 rule 2). */
  ready?: () => Promise<void>;
  /** store SAMPLE — inject để test; production thay bằng repo thật. */
  itemStore?: Map<string, Item>;
}

export function buildApp(deps: AppDeps): FastifyInstance {
  const { env } = deps;
  const logger = ` +
    ctx.camel +
    `Logger(env.logLevel);

  const app = Fastify({
    // pino ≥9.14 Logger type ≠ FastifyBaseLogger (msgPrefix) — cast giao diện log,
    // instance vẫn là pino shape conventions/03 (pattern node-svc).
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

  // Error envelope chung (conventions/04) — map mọi error, kể cả FST_ERR_*.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const isValidation = Array.isArray(err.validation);
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : isValidation ? 400 : 500;
    request.log[status >= 500 ? 'error' : 'warn']({ err: err.message }, 'request failed');
    reply.status(status).send({
      error: {
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
      error: { code: 'NOT_FOUND', message: 'Route ' + request.method + ' ' + request.url + ' không tồn tại', requestId: request.id, details: null },
    });
  });

  // Health: naked (compose healthcheck + boot-smoke) + mirror /api/` +
    ctx.name +
    `/*.
  const ready = deps.ready ?? (async () => {});
  registerHealthRoutes(app, { check: ready });
  app.register(
    async (scope) => {
      registerHealthRoutes(scope, { check: ready });
    },
    { prefix: '/api/` +
    ctx.name +
    `' },
  );

  // SAMPLE /api/` +
    ctx.name +
    `/items — thay bằng route thật theo contracts/openapi/` +
    ctx.name +
    `.yaml.
  app.register(
    async (scope) => {
      registerItemRoutes(scope, { jwtSecret: env.jwtSecret, store: deps.itemStore ?? new Map() });
    },
    { prefix: '/api/` +
    ctx.name +
    `' },
  );

  return app;
}
`
  );
}

function serverTs(ctx) {
  const dbBoot = ctx.db
    ? `  // DB pool — readyz kiểm THẬT bằng SELECT 1 (conventions/02 rule 2).
  const pool = new Pool({ connectionString: env.dbUrl });
  const ready = async (): Promise<void> => {
    await pool.query('SELECT 1');
  };

`
    : `  // Chưa có dep thật — ready no-op. KHI THÊM DB/deps: kiểm dep thật ở đây
  // (conventions/02 rule 2 — không hardcode 200).
  const ready = async (): Promise<void> => {};

`;
  const dbImport = ctx.db ? `import { Pool } from 'pg';\n` : '';
  const dbClose = ctx.db ? `  await pool.end();\n` : '';
  return (
    dbImport +
    `// server.ts — boot entry: env fail-fast (conventions/06) → build app → listen
// PORT (conventions/05). Sinh bởi gen-service.
import { buildApp } from './app.js';
import { loadEnv } from './env.js';
import { ` +
    ctx.camel +
    `Logger } from './logger.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = ` +
    ctx.camel +
    `Logger(env.logLevel);

` +
    dbBoot +
    `  const app = buildApp({ env, ready });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    await app.close();
` +
    dbClose +
    `    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: env.port, host: '0.0.0.0' });
  logger.info({ port: env.port }, '` +
    ctx.name +
    ` listening');
}

main().catch((err) => {
  // fail-fast boot (conventions/06 rule 6) — không fallback im lặng
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', service: '` +
    ctx.name +
    `', msg: 'boot failed', err: err instanceof Error ? err.stack : String(err) }));
  process.exit(1);
});
`
  );
}

function appTestTs(ctx) {
  const envSource = ctx.db
    ? `{ PORT: String(PORT), JWT_SECRET: SECRET, DATABASE_URL: 'postgres://test:test@127.0.0.1:5432/test', LOG_LEVEL: 'warn' }`
    : `{ PORT: String(PORT), JWT_SECRET: SECRET, LOG_LEVEL: 'warn' }`;
  return (
    `// app.test.ts — smoke conventions: health shape (conventions/02), error envelope
// (conventions/04), JWT guard (conventions/08 rule 4). Chạy KHÔNG cần DB/network.
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { loadEnv } from './env.js';

const PORT = ` +
    ctx.port +
    `;
const SECRET = 'test-secret-not-real-32chars-xxxxxxx';
const env = loadEnv(` +
    envSource +
    `);

function token(): string {
  return jwt.sign(
    { sub: '11111111-1111-4111-8111-111111111111', email: 'alice@demo.local', roles: ['admin'] },
    SECRET,
    { expiresIn: '5m' },
  );
}

const BASE = '/api/` +
    ctx.name +
   `';

describe('health (conventions/02)', () => {
  it('healthz trả {"status":"ok"} — shape CỐ ĐỊNH (boot-smoke grep)', async () => {
    const app = buildApp({ env });
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    // mirror dưới prefix — rule 6
    const mirror = await app.inject({ method: 'GET', url: BASE + '/healthz' });
    expect(mirror.statusCode).toBe(200);
    await app.close();
  });

  it('readyz sẵn sàng → 200; dep hỏng → 503 envelope DEPENDENCY_DOWN', async () => {
    const ok = buildApp({ env, ready: async () => {} });
    expect((await ok.inject({ method: 'GET', url: '/readyz' })).statusCode).toBe(200);
    await ok.close();

    const down = buildApp({ env, ready: async () => { throw new Error('db gone'); } });
    const res = await down.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('DEPENDENCY_DOWN');
    await down.close();
  });
});

describe('items SAMPLE (conventions/04 + 08)', () => {
  it('không token → 401 envelope UNAUTHORIZED (service tự chặn, không nhờ gateway)', async () => {
    const app = buildApp({ env });
    const res = await app.inject({ method: 'GET', url: BASE + '/items' });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error).toHaveProperty('requestId');
    await app.close();
  });

  it('token hợp lệ → POST 201 + GET list shape {items,total}', async () => {
    const store = new Map();
    const app = buildApp({ env, itemStore: store });
    const created = await app.inject({
      method: 'POST',
      url: BASE + '/items',
      headers: { authorization: 'Bearer ' + token() },
      payload: { name: 'việc đầu tiên' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().name).toBe('việc đầu tiên');

    const list = await app.inject({
      method: 'GET',
      url: BASE + '/items',
      headers: { authorization: 'Bearer ' + token() },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toMatchObject({ total: 1 });
    await app.close();
  });

  it('body sai schema → 400 VALIDATION_ERROR (envelope)', async () => {
    const app = buildApp({ env });
    const res = await app.inject({
      method: 'POST',
      url: BASE + '/items',
      headers: { authorization: 'Bearer ' + token() },
      payload: { name: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
    await app.close();
  });

  it('route lạ → 404 NOT_FOUND envelope', async () => {
    const app = buildApp({ env });
    const res = await app.inject({ method: 'GET', url: BASE + '/khong-ton-tai' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
    await app.close();
  });
});
`
  );
}

function readmeMd(ctx) {
  return (
    `# ` +
    ctx.pascal +
    ` (` +
    ctx.name +
    `)

Sinh bởi \`scripts/generators/gen-service.mjs\` (--lang ts). Khung ĐÃ theo conventions — impl domain là việc tiếp theo.

| Hạng mục | Giá trị |
|---|---|
| Port | ` +
    ctx.port +
    ` (env \`PORT\` — conventions/05) |
| Health | \`/healthz\` + \`/readyz\` naked + mirror \`/api/` +
    ctx.name +
    `/*\` (conventions/02) |
| Gateway | \`/api/` +
    ctx.name +
    `/*\` → \`http://` +
    ctx.name +
    `:` +
    ctx.port +
    `\` (presence-check 401 — conventions/08) |
| Contract | \`contracts/openapi/` +
    ctx.name +
    `.yaml\` (stub — sửa TRƯỚC khi impl) |
| DB | ` +
    (ctx.db
      ? `có — \`DATABASE_URL\` (role ` +
        ctx.dbRole +
        `, checklist init script)`
      : `chưa — thêm \`--db\` logic + env khi cần`) +
    ` |

## Chạy

\`\`\`bash
# workspace đã có services/` +
    ctx.name +
    ` — cài deps (standalone lockfile, conventions/01 rule 7)
cd services/` +
    ctx.name +
    ` && pnpm install --ignore-workspace
pnpm --filter ` +
    ctx.name +
    ` test          # unit smoke conventions
pnpm --filter ` +
    ctx.name +
    ` dev            # native dev, cần JWT_SECRET trong env
\`\`\`

## Việc tiếp theo (AI directives)

1. Sửa \`contracts/openapi/` +
    ctx.name +
    `.yaml\` — thay resource \`items\` bằng domain thật → \`pnpm lint:contracts\`.
2. \`pnpm --filter ` +
    ctx.name +
    ` generate:types\` → impl route thật thay \`src/routes/items.ts\` (SAMPLE).
3. \`readyz\`: khi thêm dep → kiểm dep thật trong \`ready\` (conventions/02 rule 2).
4. Xem \`next_steps\` JSON output của generator cho danh sách đầy đủ.
`
  );
}

/** Trả { relPath: content } — toàn bộ file của service TS. */
export function serviceTsFiles(ctx) {
  return {
    'package.json': JSON.stringify(pkg(ctx), null, 2) + '\n',
    'tsconfig.json': tsconfig,
    'vitest.config.ts': vitestConfig,
    Dockerfile: dockerfile(ctx),
    'README.md': readmeMd(ctx),
    'src/env.ts': envTs(ctx),
    'src/logger.ts': loggerTs(ctx),
    'src/auth.ts': authTs(),
    'src/routes/health.ts': healthTs(ctx),
    'src/routes/items.ts': itemsTs(ctx),
    'src/app.ts': appTs(ctx),
    'src/server.ts': serverTs(ctx),
    'src/app.test.ts': appTestTs(ctx),
  };
}
