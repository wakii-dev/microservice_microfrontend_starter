// outbox-relay.ts — relay worker poll outbox → publish topic `task-events`
// (conventions/09 rule 2 + task-events.md). KHÔNG publish trong request path:
// mutation chỉ ghi outbox trong tx (repo.drizzle.ts), relay publish SAU —
// publish TRƯỚC mark published_at → crash giữa chừng = publish lại (duplicate)
// → at-least-once, consumer dedupe bằng envelope id. Message key = payload.taskId
// (thứ tự per-task trong 1 partition — task-events.md). Purge row published cũ.
import { inArray, isNull, lt } from 'drizzle-orm';
import { Kafka, type Producer } from 'kafkajs';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outbox, type OutboxRow } from './db/schema.js';
import type { LogFn } from './types/log.js';

export const TASK_EVENTS_TOPIC = 'task-events';
export const RELAY_BATCH = 100;
export const PURGE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // published cũ > 7 ngày
export const PURGE_EVERY_TICKS = 240; // ~2 phút ở poll 500ms

/** Envelope đúng golden fixture format (contracts/events/fixtures/*.json —
 *  task-events.md là nguồn sự thật; test 2 đầu load chung fixture). */
export interface EventEnvelope {
  schemaVersion: 1;
  id: string;
  type: string;
  occurredAt: string; // RFC3339 UTC — thời điểm mutation (createdAt của row outbox)
  payload: Record<string, unknown>;
}

export function toEnvelope(row: OutboxRow): EventEnvelope {
  return {
    schemaVersion: 1,
    id: row.id,
    type: row.type,
    occurredAt: row.createdAt.toISOString(),
    payload: row.payload as Record<string, unknown>, // jsonb select type = unknown
  };
}

export interface OutboxMessage {
  key: string | null; // = payload.taskId (task-events.md)
  value: string; // JSON envelope
}

function messageKey(envelope: EventEnvelope): string | null {
  const taskId = envelope.payload.taskId;
  return typeof taskId === 'string' ? taskId : null;
}

/** Trừu tượng publish cho unit test (fake producer). */
export interface EventPublisher {
  send(topic: string, messages: OutboxMessage[]): Promise<void>;
}

/** Trừu tượng đọc/ghi outbox cho unit test (fake store). */
export interface OutboxStore {
  findUnpublished(limit: number): Promise<OutboxRow[]>;
  markPublished(ids: string[]): Promise<void>;
  purgePublished(olderThan: Date): Promise<number>;
}

export class DrizzleOutboxStore implements OutboxStore {
  constructor(private readonly db: NodePgDatabase) {}

  async findUnpublished(limit: number): Promise<OutboxRow[]> {
    return this.db
      .select()
      .from(outbox)
      .where(isNull(outbox.publishedAt))
      .orderBy(outbox.createdAt)
      .limit(limit);
  }

  async markPublished(ids: string[]): Promise<void> {
    await this.db
      .update(outbox)
      .set({ publishedAt: new Date() })
      .where(inArray(outbox.id, ids));
  }

  async purgePublished(olderThan: Date): Promise<number> {
    const purged = await this.db
      .delete(outbox)
      .where(lt(outbox.publishedAt, olderThan))
      .returning();
    return purged.length;
  }
}

/** kafkajs producer — lazy-connect (conventions/09 rule 1): connect fail =
 *  throw → relay warn + retry tick kế (KHÔNG crash, KHÔNG vào readyz). */
export class KafkaEventPublisher implements EventPublisher {
  private producer: Producer | null = null;
  private readonly kafka: Kafka;

  constructor(
    brokers: string[],
    private readonly log: LogFn,
  ) {
    this.kafka = new Kafka({ clientId: 'node-svc-outbox', brokers });
  }

  async send(topic: string, messages: OutboxMessage[]): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
      await this.producer.connect(); // fail → throw → relay retry tick sau
      this.log('info', 'kafka producer connected');
    }
    try {
      await this.producer.send({ topic, messages });
    } catch (err) {
      // send fail sau connect (broker sập giữa chừng) — drop producer để tick
      // sau connect lại từ đầu thay vì tái dụng connection chết (review NV-fix)
      this.producer = null;
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
  }
}

export class OutboxRelay {
  private timer: NodeJS.Timeout | undefined;
  private ticks = 0;
  private running = false; // in-flight guard — tick >interval không chồng nhau
  private readonly purgeEveryTicks: number;
  private readonly purgeAfterMs: number;

  constructor(
    private readonly store: OutboxStore,
    private readonly publisher: EventPublisher,
    private readonly log: LogFn,
    private readonly intervalMs = 500, // spec: poll ~500ms
    opts: { purgeEveryTicks?: number; purgeAfterMs?: number } = {},
  ) {
    this.purgeEveryTicks = opts.purgeEveryTicks ?? PURGE_EVERY_TICKS;
    this.purgeAfterMs = opts.purgeAfterMs ?? PURGE_AFTER_MS;
  }

  start(): void {
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** 1 chu kỳ poll — public để unit test gọi trực tiếp (không đợi interval). */
  async tick(): Promise<void> {
    if (this.running) return; // tick trước chưa xong — bỏ qua, rows còn unpublished
    this.running = true;
    try {
      this.ticks++;
      const rows = await this.store.findUnpublished(RELAY_BATCH);
      if (rows.length > 0) {
        await this.publisher.send(
          TASK_EVENTS_TOPIC,
          rows.map((row) => {
            const envelope = toEnvelope(row);
            return { key: messageKey(envelope), value: JSON.stringify(envelope) };
          }),
        );
        // publish TRƯỚC mark — crash giữa chừng = re-publish (at-least-once,
        // consumer dedupe). Mark SAU publish KHÔNG được fail ngược dòng.
        await this.store.markPublished(rows.map((row) => row.id));
      }
      if (this.ticks % this.purgeEveryTicks === 0) {
        const purged = await this.store.purgePublished(new Date(Date.now() - this.purgeAfterMs));
        if (purged > 0) this.log('info', 'outbox purged', { purged });
      }
    } catch (err) {
      this.log('warn', 'outbox relay tick failed — sẽ retry', {
        err: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.running = false;
    }
  }
}
