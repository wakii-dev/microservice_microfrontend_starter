// server.ts — boot entry (mirror node-svc): env fail-fast → DB + migration →
// seed users fixture (idempotent — USERS_FIXTURE_PATH optional, thiếu = warn +
// bỏ seed, register vẫn chạy) → listen PORT. Migration chạy lúc boot → CI
// boot-smoke thấy "migration chạy xong" qua readyz 200 (SELECT 1 thật).
import { buildApp, migrationsFolder } from './app.js';
import { closeDb, createDb } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { seedUsersFromFixture } from './db/seed.js';
import { loadEnv } from './env.js';
import { authSvcLogger } from './logger.js';
import { DrizzleAuthRepo } from './repo.drizzle.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = authSvcLogger(env.logLevel);

  const { pool, db } = createDb(env.databaseUrl);
  const repo = new DrizzleAuthRepo(db);

  // Migration — custom runner (xem db/migrate.ts: role auth_svc không có CREATE
  // trên database, chỉ trên schema auth — SF-5 init script).
  const ran = await runMigrations(db, migrationsFolder());
  logger.info({ migrations: ran }, 'migrations applied');

  // Seed fixture — idempotent ON CONFLICT (id) DO NOTHING. USERS_FIXTURE_PATH:
  // set mà file thiếu/sai = fail-fast (config lỗi); không set = warn + skip
  // (service vẫn boot — register/login user tự tạo vẫn chạy; compose + CI luôn set).
  if (env.usersFixturePath) {
    await seedUsersFromFixture(repo, env.usersFixturePath, env.authDevPassword, logger);
  } else {
    logger.warn('USERS_FIXTURE_PATH not set — skip seeding fixture users (register vẫn hoạt động)');
  }

  const app = buildApp({ env, repo });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    await app.close();
    await closeDb({ pool, db });
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: env.port, host: '0.0.0.0' });
  logger.info({ port: env.port }, 'auth-svc listening');
}

main().catch((err) => {
  // fail-fast boot (conventions/06 rule 6) — không fallback im lặng
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', service: 'auth-svc', msg: 'boot failed', err: err instanceof Error ? err.stack : String(err) }));
  process.exit(1);
});
