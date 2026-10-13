// compensation-consumer.ts — node-svc compensation consumer (saga — ADR-0008).
// Group `node-svc-compensation`, filter-by-type: CHỈ xử lý
// `task.assignment_failed` (conventions/09 rule 6 + task-events.md), 4 type còn
// lại commit + bỏ qua. Xử lý = conditional UPDATE (repo.markAssignmentFailed —
// guard chống stale compensation, idempotent theo envelope id/retry).
// Manual offset commit SAU khi DB op xong (conventions/09 rule 5). Lỗi xử lý
// retry ×3 in-memory backoff → hết lượt: message gốc + metadata vào
// `task-events.dlq` rồi commit (KHÔNG block partition — rule 7).
import { Kafka, type Consumer, type Kafka as KafkaType } from 'kafkajs';
import type { LogFn } from './types/log.js';

export const COMPENSATION_GROUP = 'node-svc-compensation';
export const DLQ_TOPIC = 'task-events.dlq';
const RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 200; // ×3 in-memory — backoff ngắn (demo scale)
const CONNECT_RETRY_MS = 5000;

/** Envelope 5 type — chỉ `task.assignment_failed` được xử lý. */
interface Envelope {
  schemaVersion?: number;
  id?: string;
  type?: string;
  occurredAt?: string;
  payload?: { taskId?: unknown; assigneeId?: unknown; [k: string]: unknown };
}

export interface CompensationDeps {
  store: { markAssignmentFailed(taskId: string, assigneeId: string): Promise<boolean> };
  dlq: { send(value: string): Promise<void> };
  commit(): Promise<void>; // offset commit — CHỈ gọi sau khi DB op xong
  log: LogFn;
  delay?(ms: number): Promise<void>;
}

/** Xử lý 1 message thô — pure logic cho unit test (không cần broker). */
export async function handleMessage(raw: string, deps: CompensationDeps): Promise<void> {
  const delay = deps.delay ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let envelope: Envelope;
  try {
    envelope = JSON.parse(raw) as Envelope;
  } catch {
    // JSON hỏng — retry vô nghĩa: thẳng DLQ (message gốc + metadata) + commit.
    await deps.dlq.send(JSON.stringify({ dlq: { reason: 'invalid_json' }, original: raw }));
    await deps.commit();
    return;
  }

  // Filter-by-type (task-events.md) — type khác: KHÔNG xử lý, vẫn commit.
  if (envelope.type !== 'task.assignment_failed') {
    await deps.commit();
    return;
  }

  const taskId = typeof envelope.payload?.taskId === 'string' ? envelope.payload.taskId : null;
  const assigneeId =
    typeof envelope.payload?.assigneeId === 'string' ? envelope.payload.assigneeId : null;
  if (!taskId || !assigneeId) {
    // Payload thiếu field bắt buộc — shape lệch hợp đồng: DLQ, không retry.
    await deps.dlq.send(
      JSON.stringify({ dlq: { reason: 'invalid_payload' }, original: envelope }),
    );
    await deps.commit();
    return;
  }

  // Retry ×3 in-memory (conventions/09 rule 7) — lỗi DB tạm thì qua; hết lượt
  // → DLQ message gốc + metadata rồi commit (không requeue, không block).
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      // false = conditional guard không khớp (stale/idempotent-replay) — vẫn là
      // xử lý THÀNH CÔNG: event không áp dụng được là hành vi đúng, commit.
      await deps.store.markAssignmentFailed(taskId, assigneeId);
      await deps.commit();
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_ATTEMPTS) await delay(RETRY_BACKOFF_MS * attempt);
    }
  }

  deps.log('error', 'compensation processing failed after retries — to DLQ', {
    envelopeId: envelope.id,
    taskId,
    err: lastErr instanceof Error ? lastErr.message : String(lastErr),
  });
  await deps.dlq.send(
    JSON.stringify({
      dlq: { reason: 'processing_failed_after_retries', error: String(lastErr) },
      original: envelope,
    }),
  );
  await deps.commit();
}

export class CompensationConsumer {
  private readonly kafka: KafkaType;
  private consumer: Consumer | null = null;
  private stopped = false;

  constructor(
    private readonly brokers: string[],
    private readonly deps: Pick<CompensationDeps, 'store' | 'dlq'>,
    private readonly log: LogFn,
  ) {
    this.kafka = new Kafka({ clientId: 'node-svc-compensation', brokers });
  }

  /** Connect + subscribe + run — lazy/retry (conventions/09 rule 1): broker
   *  chưa lên = warn + retry, KHÔNG crash. Trả promise chạy dài; caller void. */
  async start(): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: COMPENSATION_GROUP });
    while (!this.stopped) {
      try {
        await consumer.connect();
        break;
      } catch (err) {
        this.log('warn', 'kafka consumer connect failed — retry', {
          err: err instanceof Error ? err.message : String(err),
        });
        await new Promise<void>((r) => setTimeout(r, CONNECT_RETRY_MS));
      }
    }
    if (this.stopped) return;
    this.consumer = consumer;

    await consumer.subscribe({ topic: 'task-events', fromBeginning: true });
    // auto.offset.reset: earliest tương đương fromBeginning cho group mới —
    // fixture demo đọc lại từ đầu, idempotency (conditional guard) lo duplicates.
    await consumer.run({
      autoCommit: false, // manual commit SAU khi DB op xong (conventions/09 rule 5)
      eachMessage: async ({ topic, partition, message }) => {
        await handleMessage(message.value?.toString() ?? '', {
          ...this.deps,
          commit: async () => {
            await consumer.commitOffsets([
              { topic, partition, offset: (BigInt(message.offset) + 1n).toString() },
            ]);
          },
          log: this.log,
        });
      },
    });
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }
}
