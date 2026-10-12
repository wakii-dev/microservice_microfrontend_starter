// server.ts — boot entry: env fail-fast → DB + migration → spring reachability
// (1 lần, warn-only — deviation D3) → listen PORT. Migration chạy lúc boot →
// boot-smoke CI thấy "migration chạy xong" qua readyz 200.
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { buildApp, migrationsFolder } from './app.js';
import { HttpActivityClient } from './clients/activity.js';
import { HttpSpringClient } from './clients/spring.js';
import { closeDb, createDb } from './db/client.js';
import { loadEnv } from './env.js';
import { nodeSvcLogger } from './logger.js';
import { DrizzleTaskRepo } from './repo.drizzle.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = nodeSvcLogger(env.logLevel);

  const { pool, db } = createDb(env.databaseUrl);
  const repo = new DrizzleTaskRepo(db);
  const spring = new HttpSpringClient(env.springSvcUrl, (level, msg, fields) =>
    logger[level](fields ?? {}, msg),
  );
  const activity = new HttpActivityClient(env.goSvcUrl, (level, msg, fields) =>
    logger[level](fields ?? {}, msg),
  );

  // Migration — exit criterion SF-2: sinh đúng canonical DDL (schema-diff.test
  // verify cấu trúc; bước này chạy thật lên postgres). migrationsSchema: 'tasks'
  // — role node_svc chỉ có CREATE trên schema tasks (01-init.sh), mặc định
  // schema "drizzle" của migrator sẽ bị permission denied → boot crash.
  await migrate(db, { migrationsFolder: migrationsFolder(), migrationsSchema: 'tasks' });
  logger.info('migrations applied');

  // Spring reachability — boot-time check 1 lần, CHỈ log (deviation D3):
  // spring down lúc boot KHÔNG chặn ready; fail-closed enforce ở request-time.
  const springUp = await spring.ping();
  if (!springUp) {
    logger.warn('spring-svc not reachable at boot — user validation will fail-closed 503 until it is up');
  } else {
    logger.info('spring-svc reachable');
  }

  const app = buildApp({ env, repo, spring, activity });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    await app.close();
    await closeDb({ pool, db });
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: env.port, host: '0.0.0.0' });
  logger.info({ port: env.port }, 'node-svc listening');
}

main().catch((err) => {
  // fail-fast boot (conventions/06 rule 6) — không fallback im lặng
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', service: 'node-svc', msg: 'boot failed', err: err instanceof Error ? err.stack : String(err) }));
  process.exit(1);
});
