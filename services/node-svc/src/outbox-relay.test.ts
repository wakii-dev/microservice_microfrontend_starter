// outbox-relay.test.ts — relay publish ĐÚNG golden fixture format (SF-2 FI-79).
// Test load CHUNG contracts/events/fixtures/*.json với consumer test SF-3 +
// CI console-producer (task-events.md) — không tự bịa format. Fake producer +
// fake store → không cần broker (CI boot-smoke chạy relay THẬT trên kafka).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { OutboxRow } from './db/schema.js';
import {
  OutboxRelay,
  TASK_EVENTS_TOPIC,
  toEnvelope,
  type EventPublisher,
  type OutboxMessage,
  type OutboxStore,
} from './outbox-relay.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(here, '../../../contracts/events/fixtures');

const FIXTURE_TYPES = [
  'task.created',
  'task.updated',
  'task.assigned',
  'task.deleted',
] as const;

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(FIXTURES, `${name}.json`), 'utf8')) as Record<string, unknown>;
}

function fakeStore(
  rows: OutboxRow[],
  purged = 0,
): OutboxStore & { marked: string[][]; purgeCalls: Date[] } {
  return {
    marked: [],
    purgeCalls: [],
    async findUnpublished() {
      return rows;
    },
    async markPublished(ids: string[]) {
      this.marked.push(ids);
    },
    async purgePublished(olderThan: Date) {
      this.purgeCalls.push(olderThan);
      return purged;
    },
  };
}

function fakePublisher(): EventPublisher & { sent: Array<{ topic: string; messages: OutboxMessage[] }> } {
  return { sent: [], async send(topic, messages) { this.sent.push({ topic, messages }); } };
}

/** OutboxRow từ golden fixture — payload/type lấy TRỰC TIẾP từ fixture (2 đầu
 *  load chung file), id/createdAt mô phỏng repo sinh. */
function rowFromFixture(type: string): OutboxRow {
  const fixture = loadFixture(type);
  return {
    id: fixture.id as string,
    type,
    payload: fixture.payload as Record<string, unknown>,
    createdAt: new Date('2026-10-13T09:00:00.000Z'),
    publishedAt: null,
  };
}

describe('OutboxRelay — publish đúng golden fixture format', () => {
  it('mỗi fixture type: message value khớp fixture (schemaVersion/type/payload 1:1)', async () => {
    for (const type of FIXTURE_TYPES) {
      const fixture = loadFixture(type);
      const rows = [rowFromFixture(type)];
      const store = fakeStore(rows);
      const publisher = fakePublisher();
      const relay = new OutboxRelay(store, publisher, () => {}, 500);

      await relay.tick();

      expect(publisher.sent).toHaveLength(1);
      expect(publisher.sent[0].topic).toBe(TASK_EVENTS_TOPIC);
      const message = publisher.sent[0].messages[0];
      // key = payload.taskId (task-events.md — thứ tự per-task trong partition)
      expect(message.key).toBe((fixture.payload as { taskId: string }).taskId);

      const envelope = JSON.parse(message.value) as Record<string, unknown>;
      // Envelope khớp golden fixture 1:1 (id + occurredAt là dữ liệu repo sinh)
      expect(Object.keys(envelope).sort()).toEqual(Object.keys(fixture).sort());
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.type).toBe(fixture.type);
      expect(envelope.payload).toEqual(fixture.payload);
      expect(typeof envelope.id).toBe('string');
      expect(envelope.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // publish xong mới mark published_at
      expect(store.marked).toEqual([[fixture.id]]);
    }
  });

  it('toEnvelope: occurredAt = createdAt (thời điểm mutation, không phải lúc publish)', () => {
    const row = rowFromFixture('task.created');
    const envelope = toEnvelope(row);
    expect(envelope.occurredAt).toBe('2026-10-13T09:00:00.000Z');
    expect(envelope.id).toBe(row.id);
    expect(envelope.schemaVersion).toBe(1);
  });

  it('tick fail (broker down) → warn, row giữ nguyên unpublished → tick sau retry', async () => {
    const rows = [rowFromFixture('task.created')];
    const store = fakeStore(rows);
    const publisher: EventPublisher = {
      async send() {
        throw new Error('broker down');
      },
    };
    const logs: Array<[string, string]> = [];
    const relay = new OutboxRelay(store, publisher, (level, msg) => logs.push([level, msg]), 500);

    await relay.tick();

    expect(logs[0][0]).toBe('warn'); // KHÔNG crash — conventions/09 rule 1
    expect(store.marked).toHaveLength(0); // KHÔNG mark khi publish fail
  });

  it('purge published cũ > N ngày chạy định kỳ theo tick', async () => {
    const store = fakeStore([], 3);
    const publisher = fakePublisher();
    const relay = new OutboxRelay(store, publisher, () => {}, 500, {
      purgeEveryTicks: 2,
      purgeAfterMs: 1000,
    });

    await relay.tick();
    expect(store.purgeCalls).toHaveLength(0); // tick 1 — chưa tới chu kỳ

    await relay.tick();
    expect(store.purgeCalls).toHaveLength(1);
    // cutoff = now - 1000 (tính TRONG tick, sau khi 2 tick chạy) — đúng chiều
    expect(store.purgeCalls[0].getTime()).toBeLessThanOrEqual(Date.now() - 1000);
  });
});
