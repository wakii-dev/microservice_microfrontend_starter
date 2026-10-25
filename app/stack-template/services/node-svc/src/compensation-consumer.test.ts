// compensation-consumer.test.ts — logic xử lý message của consumer (SF-2 FI-79),
// không broker: handleMessage pure với fake deps. Fixture load CHUNG
// contracts/events/fixtures (task-events.md — 2 đầu cùng nguồn sự thật).
// Conditional UPDATE guard (stale/idempotent) mirror ở fake store; SQL thật
// verify ở CI boot-smoke + saga e2e.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { handleMessage, type CompensationDeps } from './compensation-consumer.js';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(here, '../../../contracts/events/fixtures');

function loadFixtureRaw(name: string): string {
  return readFileSync(resolve(FIXTURES, `${name}.json`), 'utf8');
}

function fakeDeps(): CompensationDeps & {
  marked: Array<{ taskId: string; assigneeId: string }>;
  commits: number;
  dlqMessages: string[];
  markResult: boolean;
  failTimes: number;
} {
  const ret = {
    marked: [] as Array<{ taskId: string; assigneeId: string }>,
    commits: 0,
    dlqMessages: [] as string[],
    markResult: true,
    failTimes: 0,
  };
  const deps: CompensationDeps = {
    store: {
      // đọc markResult/failTimes từ ret (test mutate TRỰC TIẾP trên object trả về)
      async markAssignmentFailed(taskId: string, assigneeId: string) {
        ret.marked.push({ taskId, assigneeId });
        if (ret.failTimes > 0) {
          ret.failTimes--;
          throw new Error('db transient error');
        }
        return ret.markResult; // false = stale/idempotent (guard không khớp)
      },
    },
    dlq: {
      async send(value: string) {
        ret.dlqMessages.push(value);
      },
    },
    commit: async () => {
      ret.commits++;
    },
    delay: async () => {}, // instant — test không chờ backoff
    log: () => {},
  };
  return Object.assign(ret, deps);
}

describe('compensation consumer — filter-by-type + conditional guard (task-events.md)', () => {
  it('task.assignment_failed (golden fixture) → markAssignmentFailed đúng taskId+assigneeId + commit', async () => {
    const fixture = JSON.parse(loadFixtureRaw('task.assignment_failed')) as {
      payload: { taskId: string; assigneeId: string };
    };
    const deps = fakeDeps();
    await handleMessage(loadFixtureRaw('task.assignment_failed'), deps);

    expect(deps.marked).toEqual([
      { taskId: fixture.payload.taskId, assigneeId: fixture.payload.assigneeId },
    ]);
    expect(deps.commits).toBe(1); // manual commit SAU khi DB op xong
    expect(deps.dlqMessages).toHaveLength(0);
  });

  it('STALE event (assignee khác → guard không khớp) → KHÔNG đổi, vẫn commit (acceptance)', async () => {
    const deps = fakeDeps();
    deps.markResult = false; // conditional UPDATE match 0 row — stale assignee
    await handleMessage(loadFixtureRaw('task.assignment_failed'), deps);

    expect(deps.commits).toBe(1); // không-dổi là THÀNH CÔNG — offset vẫn tiến
    expect(deps.dlqMessages).toHaveLength(0);
  });

  it('IDEMPOTENT replay (event lặp → match 0 row) → commit lần 2 bình thường', async () => {
    const deps = fakeDeps();
    await handleMessage(loadFixtureRaw('task.assignment_failed'), deps);
    deps.markResult = false; // lần 2: status đã 'assignment_failed' → guard chặn
    await handleMessage(loadFixtureRaw('task.assignment_failed'), deps);

    expect(deps.marked).toHaveLength(2);
    expect(deps.commits).toBe(2);
    expect(deps.dlqMessages).toHaveLength(0);
  });

  it('type khác (task.created fixture) → KHÔNG xử lý, vẫn commit (filter-by-type)', async () => {
    const deps = fakeDeps();
    await handleMessage(loadFixtureRaw('task.created'), deps);

    expect(deps.marked).toHaveLength(0);
    expect(deps.commits).toBe(1);
  });

  it('JSON hỏng → thẳng DLQ (message gốc) + commit, không retry', async () => {
    const deps = fakeDeps();
    await handleMessage('{not-json', deps);

    expect(deps.marked).toHaveLength(0);
    expect(deps.dlqMessages).toHaveLength(1);
    expect(deps.dlqMessages[0]).toContain('invalid_json');
    expect(deps.dlqMessages[0]).toContain('{not-json');
    expect(deps.commits).toBe(1);
  });

  it('payload thiếu field bắt buộc → DLQ, không retry', async () => {
    const deps = fakeDeps();
    const bad = JSON.stringify({
      schemaVersion: 1,
      id: crypto.randomUUID(),
      type: 'task.assignment_failed',
      occurredAt: '2026-10-13T09:20:00Z',
      payload: { taskId: 'x' }, // thiếu assigneeId
    });
    await handleMessage(bad, deps);

    expect(deps.marked).toHaveLength(0);
    expect(deps.dlqMessages).toHaveLength(1);
    expect(deps.dlqMessages[0]).toContain('invalid_payload');
    expect(deps.commits).toBe(1);
  });

  it('DB fail ×3 → retry đúng 3 lần rồi DLQ (message gốc + metadata) + commit', async () => {
    const fixture = JSON.parse(loadFixtureRaw('task.assignment_failed')) as Record<string, unknown>;
    const deps = fakeDeps();
    deps.failTimes = 99; // fail mọi attempt
    await handleMessage(loadFixtureRaw('task.assignment_failed'), deps);

    expect(deps.marked).toHaveLength(3); // retry ×3 in-memory (conventions/09 rule 7)
    expect(deps.dlqMessages).toHaveLength(1);
    const dlq = JSON.parse(deps.dlqMessages[0]) as {
      dlq: { reason: string; error: string };
      original: Record<string, unknown>;
    };
    expect(dlq.dlq.reason).toBe('processing_failed_after_retries');
    expect(dlq.dlq.error).toContain('db transient error');
    expect(dlq.original).toEqual(fixture); // message GỐC giữ nguyên (task-events.md)
    expect(deps.commits).toBe(1); // KHÔNG block partition — commit sau DLQ
  });

  it('DB fail 1/3 lần → retry lần 2 thành công → KHÔNG DLQ', async () => {
    const deps = fakeDeps();
    deps.failTimes = 1;
    await handleMessage(loadFixtureRaw('task.assignment_failed'), deps);

    expect(deps.marked).toHaveLength(2);
    expect(deps.dlqMessages).toHaveLength(0);
    expect(deps.commits).toBe(1);
  });
});
