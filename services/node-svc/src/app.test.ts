// app.test.ts — unit + contract-style route tests (fixture theo tasks.yaml).
// Không postgres/spring/kafka thật: repo fake in-memory (outbox capture + seam),
// spring fake configurable. SF-2 (FI-79): activity client (ADR-0006) THAY BẰNG
// transactional outbox — event matrix assert qua outbox ghi trong fake repo,
// payload so golden fixtures (contracts/events/fixtures — load chung với relay
// test + consumer test SF-3).
import { readFileSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildApp } from './app.js';
import type { UserValidation, SpringClient } from './clients/spring.js';
import type {
  ListFilter,
  OutboxEventInput,
  Task,
  TaskCreate,
  TaskPatch,
  TaskRepo,
} from './repo.js';

const SECRET = 'test-secret-at-least-32-characters!!';
const NOW = new Date('2026-10-12T05:00:00.000Z');
const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(here, '../../../contracts/events/fixtures');

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(FIXTURES, `${name}.json`), 'utf8')) as Record<string, unknown>;
}

function makeToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    { sub: '11111111-1111-4111-8111-111111111111', email: 'alice@demo.local', roles: ['admin'], iss: 'auth-mock', ...overrides },
    SECRET,
    { algorithm: 'HS256' },
  );
}
const AUTH = { authorization: `Bearer ${makeToken()}` };

function makeTask(partial: Partial<Task> = {}): Task {
  return {
    id: partial.id ?? '9f0e0000-0000-4000-8000-000000000001',
    title: partial.title ?? 'Demo task',
    description: partial.description ?? null,
    status: partial.status ?? 'todo',
    assigneeId: partial.assigneeId ?? null,
    createdBy: partial.createdBy ?? '11111111-1111-4111-8111-111111111111',
    createdAt: partial.createdAt ?? NOW.toISOString(),
    updatedAt: partial.updatedAt ?? NOW.toISOString(),
  };
}

interface OutboxRec {
  type: OutboxEventInput['type'];
  payload: Record<string, unknown>;
}

/**
 * In-memory TaskRepo — hành vi mirror DrizzleTaskRepo (404 semantics, outbox op
 * trong cùng "tx", seam tiêm lỗi GIỮA 2 step: task mutation rồi seam rồi outbox;
 * seam fail = cả 2 rollback — mô phỏng tx rollback của postgres).
 */
function fakeRepo(seed: Task[] = []): TaskRepo & {
  created: TaskCreate[];
  patched: Array<{ id: string; patch: TaskPatch }>;
  removed: string[];
  outboxRows: OutboxRec[];
  compensated: Array<{ taskId: string; assigneeId: string }>;
  setSeamFail(v: boolean): void;
} {
  const store = new Map(seed.map((t) => [t.id, { ...t }]));
  const created: TaskCreate[] = [];
  const patched: Array<{ id: string; patch: TaskPatch }> = [];
  const removed: string[] = [];
  const outboxRows: OutboxRec[] = [];
  const compensated: Array<{ taskId: string; assigneeId: string }> = [];
  let seamFail = false;
  return {
    created,
    patched,
    removed,
    outboxRows,
    compensated,
    setSeamFail(v: boolean) {
      seamFail = v;
    },
    async ping(): Promise<void> {},
    async list(filter: ListFilter) {
      let items = [...store.values()];
      if (filter.status) items = items.filter((t) => t.status === filter.status);
      if (filter.assigneeId) items = items.filter((t) => t.assigneeId === filter.assigneeId);
      const total = items.length;
      items = items.slice(filter.offset, filter.offset + filter.limit);
      return { items, total };
    },
    async getById(id: string) {
      return store.get(id) ?? null;
    },
    async create(input: TaskCreate, events: OutboxEventInput[]) {
      created.push(input);
      const task = makeTask({
        id: input.id ?? crypto.randomUUID(),
        title: input.title,
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        createdBy: input.createdBy,
      });
      store.set(task.id, task); // step 1 — task mutation
      if (seamFail) {
        store.delete(task.id); // "rollback" — task + outbox cùng biến mất
        throw new Error('seam: fail giữa 2 step');
      }
      outboxRows.push(...events); // step 2 — outbox cùng tx
      return task;
    },
    async update(id: string, patch: TaskPatch, events: OutboxEventInput[]) {
      patched.push({ id, patch });
      const existing = store.get(id);
      if (!existing) return null;
      store.set(id, { ...existing, ...patch, updatedAt: new Date().toISOString() } as Task);
      if (seamFail) {
        store.set(id, existing); // "rollback"
        throw new Error('seam: fail giữa 2 step');
      }
      outboxRows.push(...events);
      return store.get(id)!;
    },
    async remove(id: string, events: OutboxEventInput[]) {
      removed.push(id);
      const existing = store.get(id);
      if (!existing) return false;
      store.delete(id);
      if (seamFail) {
        store.set(id, existing); // "rollback"
        throw new Error('seam: fail giữa 2 step');
      }
      outboxRows.push(...events);
      return true;
    },
    // Conditional guard mirror DrizzleTaskRepo.markAssignmentFailed
    async markAssignmentFailed(taskId: string, assigneeId: string) {
      compensated.push({ taskId, assigneeId });
      const task = store.get(taskId);
      if (!task || task.assigneeId !== assigneeId || task.status === 'assignment_failed') {
        return false; // stale/idempotent — không đổi
      }
      task.status = 'assignment_failed';
      task.updatedAt = new Date().toISOString();
      return true;
    },
  };
}

function fakeSpring(result: UserValidation, calls: string[] = []): SpringClient {
  return {
    async validateUser(userId: string) {
      calls.push(userId);
      return result;
    },
    async ping() {
      return true;
    },
  };
}

function buildTestApp(opts: { repo?: ReturnType<typeof fakeRepo>; spring?: SpringClient; corsDevOrigin?: string } = {}) {
  const repo = opts.repo ?? fakeRepo();
  const spring = opts.spring ?? fakeSpring('ok');
  const app = buildApp({
    env: {
      port: 3001,
      databaseUrl: 'postgres://unused',
      jwtSecret: SECRET,
      springSvcUrl: 'http://spring-svc:8081',
      goSvcUrl: 'http://go-svc:8082',
      corsDevOrigin: opts.corsDevOrigin ?? '',
      logLevel: 'error',
      kafkaBrokers: null, // unit test không kafka — relay/consumer không start
    },
    repo,
    spring,
  });
  return { app, repo, spring };
}

describe('health (conventions/02)', () => {
  it('healthz naked + mirror /api/tasks/healthz → 200 {"status":"ok"} (không auth)', async () => {
    const { app } = buildTestApp();
    for (const url of ['/healthz', '/api/tasks/healthz']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: 'ok' });
    }
  });

  it('readyz → 200 khi DB ping ok; 503 envelope khi DB fail', async () => {
    const okRepo = fakeRepo();
    const { app: appOk } = buildTestApp({ repo: okRepo });
    const ok = await appOk.inject({ method: 'GET', url: '/readyz' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ status: 'ok' });

    const badRepo = fakeRepo();
    vi.spyOn(badRepo, 'ping').mockRejectedValue(new Error('db down'));
    const { app: appBad } = buildTestApp({ repo: badRepo });
    const bad = await appBad.inject({ method: 'GET', url: '/readyz' });
    expect(bad.statusCode).toBe(503);
    expect(bad.json().error.code).toBe('DEPENDENCY_DOWN');
  });
});

describe('auth (token-contract.md §4 lớp 2)', () => {
  it('thiếu token → 401 envelope UNAUTHORIZED', async () => {
    const { app } = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/tasks' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHORIZED');
  });

  it('sai signature → 401', async () => {
    const { app } = buildTestApp();
    const bad = jwt.sign({ sub: 'x', iss: 'auth-mock' }, 'other-secret-32-characters-long!!!');
    const res = await app.inject({ method: 'GET', url: '/api/tasks', headers: { authorization: `Bearer ${bad}` } });
    expect(res.statusCode).toBe(401);
  });

  it('hết hạn → 401', async () => {
    const { app } = buildTestApp();
    const expired = jwt.sign({ sub: '11111111-1111-4111-8111-111111111111', iss: 'auth-mock' }, SECRET, {
      algorithm: 'HS256',
      expiresIn: -10,
    });
    const res = await app.inject({ method: 'GET', url: '/api/tasks', headers: { authorization: `Bearer ${expired}` } });
    expect(res.statusCode).toBe(401);
  });

  it('iss sai → 401', async () => {
    const { app } = buildTestApp();
    const wrongIss = makeToken({ iss: 'not-auth-mock' });
    const res = await app.inject({ method: 'GET', url: '/api/tasks', headers: { authorization: `Bearer ${wrongIss}` } });
    expect(res.statusCode).toBe(401);
  });
});

describe('CRUD /api/tasks + outbox event matrix (contract: tasks.yaml + task-events.md)', () => {
  it('create (không assignee) → 201 + outbox task.created khớp golden fixture', async () => {
    const repo = fakeRepo();
    const { app } = buildTestApp({ repo });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'New task', description: 'demo' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.title).toBe('New task');
    expect(body.status).toBe('todo');
    expect(body.createdBy).toBe('11111111-1111-4111-8111-111111111111');
    expect(repo.created).toHaveLength(1);
    // Event matrix: POST → task.created, payload khớp fixture (2 đầu load chung)
    const fixture = loadFixture('task.created') as { type: string; payload: Record<string, unknown> };
    expect(repo.outboxRows).toHaveLength(1);
    expect(repo.outboxRows[0].type).toBe(fixture.type);
    expect(Object.keys(repo.outboxRows[0].payload).sort()).toEqual(Object.keys(fixture.payload).sort());
    expect(repo.outboxRows[0].payload.userId).toBe('11111111-1111-4111-8111-111111111111');
    expect(repo.outboxRows[0].payload.title).toBe('New task');
    expect(repo.outboxRows[0].payload.status).toBe('todo');
    expect(repo.outboxRows[0].payload.taskId).toBe(body.id);
    expect(repo.outboxRows[0].payload).not.toHaveProperty('assigneeId'); // optional — vắng mặt
  });

  it('create validation: thiếu title → 400 VALIDATION_ERROR; title > 200 → 400', async () => {
    const { app } = buildTestApp();
    const missing = await app.inject({ method: 'POST', url: '/api/tasks', headers: AUTH, payload: {} });
    expect(missing.statusCode).toBe(400);
    expect(missing.json().error.code).toBe('VALIDATION_ERROR');
    const tooLong = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'x'.repeat(201) },
    });
    expect(tooLong.statusCode).toBe(400);
  });

  it('assignee tồn tại (spring ok) → 201; payload có assigneeId; gọi spring với đúng userId', async () => {
    const springCalls: string[] = [];
    const repo = fakeRepo();
    const assigneeId = '22222222-2222-4222-8222-222222222222';
    const { app } = buildTestApp({ repo, spring: fakeSpring('ok', springCalls) });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'Assigned', assigneeId },
    });
    expect(res.statusCode).toBe(201);
    expect(springCalls).toEqual([assigneeId]);
    expect(res.json().assigneeId).toBe(assigneeId);
    expect(repo.outboxRows[0].payload.assigneeId).toBe(assigneeId);
  });

  it('assignee không tồn tại (spring 404) → 422 UNPROCESSABLE, KHÔNG ghi (kể cả outbox)', async () => {
    const repo = fakeRepo();
    const { app } = buildTestApp({ repo, spring: fakeSpring('not_found') });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'Ghost', assigneeId: '22222222-2222-4222-8222-222222222222' },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('UNPROCESSABLE');
    expect(repo.created).toHaveLength(0);
    expect(repo.outboxRows).toHaveLength(0);
  });

  it('spring down/timeout → 503 DEPENDENCY_DOWN fail-closed, KHÔNG ghi (acceptance)', async () => {
    const repo = fakeRepo();
    const { app } = buildTestApp({ repo, spring: fakeSpring('down') });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'Nope', assigneeId: '22222222-2222-4222-8222-222222222222' },
    });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('DEPENDENCY_DOWN');
    expect(repo.created).toHaveLength(0);
    expect(repo.outboxRows).toHaveLength(0);
  });

  it('SEAM fail giữa 2 step → 500 + task VÀ outbox cùng biến mất (acceptance tx rollback)', async () => {
    const repo = fakeRepo();
    repo.setSeamFail(true);
    const { app } = buildTestApp({ repo });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'Will roll back' },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error.code).toBe('INTERNAL');
    // rollback: GET không thấy task; outbox không có event nào
    const get = await app.inject({
      method: 'GET',
      url: '/api/tasks/9f0e0000-0000-4000-8000-000000000001',
      headers: AUTH,
    });
    expect(get.statusCode).toBe(404);
    expect(repo.outboxRows).toHaveLength(0);
  });

  it('list → {items,total}; filter status + phân trang', async () => {
    const repo = fakeRepo([
      makeTask({ id: '9f0e0000-0000-4000-8000-000000000001', status: 'todo' }),
      makeTask({ id: '9f0e0000-0000-4000-8000-000000000002', status: 'done' }),
      makeTask({ id: '9f0e0000-0000-4000-8000-000000000003', status: 'done' }),
    ]);
    const { app } = buildTestApp({ repo });
    const all = await app.inject({ method: 'GET', url: '/api/tasks', headers: AUTH });
    expect(all.statusCode).toBe(200);
    expect(all.json().total).toBe(3);
    expect(all.json().items).toHaveLength(3);
    const done = await app.inject({ method: 'GET', url: '/api/tasks?status=done&limit=1&offset=0', headers: AUTH });
    expect(done.json().total).toBe(2);
    expect(done.json().items).toHaveLength(1);
  });

  it('get by id → 200; không thấy → 404 TASK_NOT_FOUND; non-uuid → 400', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const { app } = buildTestApp({ repo: fakeRepo([makeTask({ id })]) });
    const ok = await app.inject({ method: 'GET', url: `/api/tasks/${id}`, headers: AUTH });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().id).toBe(id);
    const missing = await app.inject({ method: 'GET', url: `/api/tasks/${crypto.randomUUID()}`, headers: AUTH });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error.code).toBe('TASK_NOT_FOUND');
    const bad = await app.inject({ method: 'GET', url: '/api/tasks/not-a-uuid', headers: AUTH });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('GET task status assignment_failed (system-owned) → 200 hợp lệ (TaskStatusExtended)', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const { app } = buildTestApp({ repo: fakeRepo([makeTask({ id, status: 'assignment_failed' })]) });
    const res = await app.inject({ method: 'GET', url: `/api/tasks/${id}`, headers: AUTH });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('assignment_failed');
  });

  it('PATCH status assignment_failed → 400 (PATCH KHÔNG nhận — system-owned)', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const { app } = buildTestApp({ repo: fakeRepo([makeTask({ id })]) });
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${id}`,
      headers: AUTH,
      payload: { status: 'assignment_failed' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('patch không assigneeId → task.updated khớp fixture; payload chỉ title/status/assigneeId', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const repo = fakeRepo([makeTask({ id })]);
    const { app } = buildTestApp({ repo });
    const ok = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, headers: AUTH, payload: { status: 'done' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().status).toBe('done');
    const fixture = loadFixture('task.updated') as { type: string; payload: Record<string, unknown> };
    expect(repo.outboxRows).toHaveLength(1);
    expect(repo.outboxRows[0].type).toBe(fixture.type);
    expect(Object.keys(repo.outboxRows[0].payload).sort()).toEqual(['taskId', 'userId', 'status'].sort());
    expect(repo.outboxRows[0].payload.taskId).toBe(id);
  });

  it('patch CHỈ description → vẫn task.updated, payload không có field thay đổi (shape task-events.md)', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const repo = fakeRepo([makeTask({ id })]);
    const { app } = buildTestApp({ repo });
    const ok = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, headers: AUTH, payload: { description: 'mới' } });
    expect(ok.statusCode).toBe(200);
    expect(repo.outboxRows).toHaveLength(1);
    expect(repo.outboxRows[0].type).toBe('task.updated');
    expect(Object.keys(repo.outboxRows[0].payload).sort()).toEqual(['taskId', 'userId']);
  });

  it('patch có assigneeId → task.assigned khớp fixture; presence-based (same-value vẫn bắn)', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const assigneeId = '22222222-2222-4222-8222-222222222222';
    const repo = fakeRepo([makeTask({ id, assigneeId })]);
    const { app } = buildTestApp({ repo, spring: fakeSpring('ok') });
    const ok = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${id}`,
      headers: AUTH,
      payload: { assigneeId }, // SAME-VALUE — presence-based: vẫn event mới
    });
    expect(ok.statusCode).toBe(200);
    const fixture = loadFixture('task.assigned') as { type: string; payload: Record<string, unknown> };
    expect(repo.outboxRows).toHaveLength(1); // chỉ assigned — không có field khác
    expect(repo.outboxRows[0].type).toBe(fixture.type);
    expect(repo.outboxRows[0].payload).toEqual({
      taskId: id,
      userId: '11111111-1111-4111-8111-111111111111',
      assigneeId,
    });
  });

  it('patch assigneeId + title → 2 events: task.assigned TRƯỚC task.updated (matrix rev 2)', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const repo = fakeRepo([makeTask({ id })]);
    const { app } = buildTestApp({ repo, spring: fakeSpring('ok') });
    const ok = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${id}`,
      headers: AUTH,
      payload: { assigneeId: '22222222-2222-4222-8222-222222222222', title: 'Mới' },
    });
    expect(ok.statusCode).toBe(200);
    expect(repo.outboxRows.map((e) => e.type)).toEqual(['task.assigned', 'task.updated']);
    expect(repo.outboxRows[1].payload).toMatchObject({ taskId: id, title: 'Mới' });
  });

  it('patch → minProperties=1 → 400; không thấy → 404; đổi assigneeId lạ → 422', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const { app } = buildTestApp({ repo: fakeRepo([makeTask({ id })]) });
    const empty = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, headers: AUTH, payload: {} });
    expect(empty.statusCode).toBe(400);
    const missing = await app.inject({ method: 'PATCH', url: `/api/tasks/${crypto.randomUUID()}`, headers: AUTH, payload: { status: 'done' } });
    expect(missing.statusCode).toBe(404);
    const { app: appGhost } = buildTestApp({ repo: fakeRepo([makeTask({ id })]), spring: fakeSpring('not_found') });
    const ghost = await appGhost.inject({
      method: 'PATCH',
      url: `/api/tasks/${id}`,
      headers: AUTH,
      payload: { assigneeId: '33333333-3333-4333-8333-333333333333' },
    });
    expect(ghost.statusCode).toBe(422);
  });

  it('delete → 204 + outbox task.deleted khớp golden fixture; lần 2 → 404', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const repo = fakeRepo([makeTask({ id })]);
    const { app } = buildTestApp({ repo });
    const ok = await app.inject({ method: 'DELETE', url: `/api/tasks/${id}`, headers: AUTH });
    expect(ok.statusCode).toBe(204);
    const fixture = loadFixture('task.deleted') as { type: string; payload: Record<string, unknown> };
    expect(repo.outboxRows).toHaveLength(1);
    expect(repo.outboxRows[0].type).toBe(fixture.type);
    expect(Object.keys(repo.outboxRows[0].payload).sort()).toEqual(Object.keys(fixture.payload).sort());
    expect(repo.outboxRows[0].payload.taskId).toBe(id);
    const again = await app.inject({ method: 'DELETE', url: `/api/tasks/${id}`, headers: AUTH });
    expect(again.statusCode).toBe(404);
    expect(repo.outboxRows).toHaveLength(1); // 404 — không thêm event
  });
});

describe('CORS dev-profile (conventions/07)', () => {
  it('CORS_DEV_ORIGIN set → preflight 204 + ACAO echo dev origin', async () => {
    const { app } = buildTestApp({ corsDevOrigin: 'http://localhost:3000,http://localhost:4001' });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/tasks',
      headers: { origin: 'http://localhost:3000', 'access-control-request-method': 'POST' },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('CORS_DEV_ORIGIN rỗng (compose/prod) → KHÔNG ACAO (deny-by-default)', async () => {
    const { app } = buildTestApp({ corsDevOrigin: '' });
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/tasks',
      headers: { origin: 'http://evil.example', 'access-control-request-method': 'POST' },
    });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('origin ngoài danh sách dev → không ACAO', async () => {
    const { app } = buildTestApp({ corsDevOrigin: 'http://localhost:3000' });
    const res = await app.inject({
      method: 'GET',
      url: '/healthz',
      headers: { origin: 'http://evil.example' },
    });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('error envelope + swagger', () => {
  it('route lạ → 404 envelope NOT_FOUND', async () => {
    const { app } = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/api/unknown', headers: AUTH });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });

  it('swagger UI + OpenAPI JSON serve ở /api/tasks/docs', async () => {
    const { app } = buildTestApp();
    const json = await app.inject({ method: 'GET', url: '/api/tasks/docs/json' });
    expect(json.statusCode).toBe(200);
    const spec = json.json();
    expect(spec.info.title).toContain('Tasks API');
  });
});
