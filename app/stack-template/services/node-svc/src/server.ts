// server.ts — boot entry: env fail-fast → DB + migration → spring reachability
// (1 lần, warn-only — deviation D3) → relay + compensation consumer (lazy, KHÔNG
// vào readyz — conventions/09 rule 1) → listen PORT. Migration chạy lúc boot →
// boot-smoke CI thấy "migration chạy xong" qua readyz 200.
import { buildApp, migrationsFolder } from './app.js';
import { CompensationConsumer } from './compensation-consumer.js';
import { HttpSpringClient } from './clients/spring.js';
import { closeDb, createDb } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { loadEnv } from './env.js';
import { nodeSvcLogger } from './logger.js';
import { DrizzleTaskRepo } from './repo.drizzle.js';
import { DrizzleOutboxStore, KafkaEventPublisher, OutboxRelay } from './outbox-relay.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = nodeSvcLogger(env.logLevel);

  const { pool, db } = createDb(env.databaseUrl);
  const repo = new DrizzleTaskRepo(db);
  const spring = new HttpSpringClient(env.springSvcUrl, (level, msg, fields) =>
    logger[level](fields ?? {}, msg),
  );

  // Migration — exit criterion SF-2: sinh đúng canonical DDL (schema-diff.test
  // verify cấu trúc; bước này chạy thật lên postgres). Custom runner — xem
  // db/migrate.ts (drizzle migrator phát CREATE SCHEMA cần CREATE trên DB).
  const ran = await runMigrations(db, migrationsFolder());
  logger.info({ migrations: ran }, 'migrations applied');

  // Spring reachability — boot-time check 1 lần, CHỈ log (deviation D3):
  // spring down lúc boot KHÔNG chặn ready; fail-closed enforce ở request-time.
  const springUp = await spring.ping();
  if (!springUp) {
    logger.warn('spring-svc not reachable at boot — user validation will fail-closed 503 until it is up');
  } else {
    logger.info('spring-svc reachable');
  }

  const app = buildApp({ env, repo, spring });

  // Kafka (SF-2 FI-79) — lazy: KAFKA_BROKERS thiếu = warn + không start (service
  // vẫn boot, conventions/09 rule 1); có = relay outbox + compensation consumer.
  const logFn = (level: 'debug' | 'info' | 'warn' | 'error', msg: string, fields?: object) =>
    logger[level](fields ?? {}, msg);
  let relay: OutboxRelay | undefined;
  let publisher: KafkaEventPublisher | undefined;
  let consumer: CompensationConsumer | undefined;
  if (env.kafkaBrokers) {
    const brokers = env.kafkaBrokers.split(',').map((b) => b.trim()).filter(Boolean);
    publisher = new KafkaEventPublisher(brokers, logFn);
    relay = new OutboxRelay(new DrizzleOutboxStore(db), publisher, logFn);
    relay.start();
    consumer = new CompensationConsumer(
      brokers,
      { store: repo, dlq: { send: async (value) => publisher!.send('task-events.dlq', [{ key: null, value }]) } },
      logFn,
    );
    // .catch phòng thủ cuối — bất kỳ lỗi nào thoát start() KHÔNG được crash
    // process (conventions/09 rule 1; CI 38365465140: unhandled rejection)
    consumer.start().catch((err: unknown) =>
      logFn('warn', 'compensation consumer stopped with error', {
        err: err instanceof Error ? err.message : String(err),
      }),
    );
  } else {
    logger.warn('KAFKA_BROKERS not set — outbox relay + compensation consumer disabled');
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    relay?.stop();
    await consumer?.stop();
    await publisher?.disconnect();
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
