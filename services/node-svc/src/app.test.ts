// app.test.ts — unit + contract-style route tests (fixture theo tasks.yaml).
// Không postgres/spring/go thật: repo fake in-memory, spring fake configurable,
// activity recording. EXTERNAL-HTTP case dùng real HttpActivityClient trỏ
// closed-port để chứng minh fire-and-forget (201 trả ngay, không chặn).
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from './app.js';
import { HttpActivityClient } from './clients/activity.js';
import type { UserValidation, SpringClient } from './clients/spring.js';
import type { ListFilter, Task, TaskCreate, TaskPatch, TaskRepo } from './repo.js';

const SECRET = 'test-secret-at-least-32-characters!!';
const NOW = new Date('2026-10-12T05:00:00.000Z');

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

/** In-memory TaskRepo — hành vi mirror DrizzleTaskRepo (404 semantics v.v.). */
function fakeRepo(seed: Task[] = []): TaskRepo & { created: TaskCreate[]; patched: Array<{ id: string; patch: TaskPatch }>; removed: string[] } {
  const store = new Map(seed.map((t) => [t.id, t]));
  const created: TaskCreate[] = [];
  const patched: Array<{ id: string; patch: TaskPatch }> = [];
  const removed: string[] = [];
  return {
    created,
    patched,
    removed,
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
    async create(input: TaskCreate) {
      created.push(input);
      const task = makeTask({
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        createdBy: input.createdBy,
      });
      store.set(task.id, task);
      return task;
    },
    async update(id: string, patch: TaskPatch) {
      patched.push({ id, patch });
      const existing = store.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() } as Task;
      store.set(id, updated);
      return updated;
    },
    async remove(id: string) {
      removed.push(id);
      return store.delete(id);
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

function buildTestApp(opts: {
  repo?: ReturnType<typeof fakeRepo>;
  spring?: SpringClient;
  corsDevOrigin?: string;
  activity?: HttpActivityClient;
} = {}) {
  const repo = opts.repo ?? fakeRepo();
  const spring = opts.spring ?? fakeSpring('ok');
  const activity =
    opts.activity ?? ({ push: (_e: unknown, _t?: string) => {} } as unknown as HttpActivityClient);
  const app = buildApp({
    env: {
      port: 3001,
      databaseUrl: 'postgres://unused',
      jwtSecret: SECRET,
      springSvcUrl: 'http://spring-svc:8081',
      goSvcUrl: 'http://go-svc:8082',
      corsDevOrigin: opts.corsDevOrigin ?? '',
      logLevel: 'error',
    },
    repo,
    spring,
    activity,
  });
  return { app, repo, spring, activity };
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

describe('CRUD /api/tasks (contract: tasks.yaml)', () => {
  it('create (không assignee) → 201 + event task.created với userId = sub', async () => {
    const repo = fakeRepo();
    const captured: Array<{ event: Record<string, unknown>; token?: string }> = [];
    const activity = {
      push: ((event: Record<string, unknown>, token?: string) => {
        captured.push({ event, token });
      }) as unknown as HttpActivityClient['push'],
    };
    const { app } = buildTestApp({ repo, activity });
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
    expect(captured).toHaveLength(1);
    expect(captured[0].event.action).toBe('task.created');
    expect(captured[0].event.userId).toBe('11111111-1111-4111-8111-111111111111');
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

  it('assignee tồn tại (spring ok) → 201; gọi spring với đúng userId', async () => {
    const springCalls: string[] = [];
    const assigneeId = '22222222-2222-4222-8222-222222222222';
    const { app } = buildTestApp({ spring: fakeSpring('ok', springCalls) });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'Assigned', assigneeId },
    });
    expect(res.statusCode).toBe(201);
    expect(springCalls).toEqual([assigneeId]);
    expect(res.json().assigneeId).toBe(assigneeId);
  });

  it('assignee không tồn tại (spring 404) → 422 UNPROCESSABLE, KHÔNG ghi', async () => {
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
    expect(repo.created).toHaveLength(0); // không ghi nửa chừng
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
  });

  it('go-svc down → tạo task VẪN 201, không chặn (fire-and-forget, acceptance)', async () => {
    // real HttpActivityClient trỏ closed port — push fail warn nhưng POST vẫn 201
    const { app } = buildTestApp({ activity: new HttpActivityClient('http://127.0.0.1:1', () => {}) });
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: AUTH,
      payload: { title: 'Event lost is fine' },
    });
    expect(res.statusCode).toBe(201);
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

  it('patch → 200; minProperties=1 → 400; không thấy → 404; đổi assigneeId lạ → 422', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const { app } = buildTestApp({ repo: fakeRepo([makeTask({ id })]) });
    const ok = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, headers: AUTH, payload: { status: 'done' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().status).toBe('done');
    const empty = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, headers: AUTH, payload: {} });
    expect(empty.statusCode).toBe(400);
    const missing = await app.inject({ method: 'PATCH', url: `/api/tasks/${crypto.randomUUID()}`, headers: AUTH, payload: { status: 'done' } });
    expect(missing.statusCode).toBe(404);
    // đổi assigneeId sang user không tồn tại (spring 404) → 422 — app riêng
    // với spring fake trả not_found
    const { app: appGhost } = buildTestApp({ repo: fakeRepo([makeTask({ id })]), spring: fakeSpring('not_found') });
    const ghost = await appGhost.inject({
      method: 'PATCH',
      url: `/api/tasks/${id}`,
      headers: AUTH,
      payload: { assigneeId: '33333333-3333-4333-8333-333333333333' },
    });
    expect(ghost.statusCode).toBe(422);
  });

  it('delete → 204; lần 2 → 404; event task.deleted', async () => {
    const id = '9f0e0000-0000-4000-8000-000000000001';
    const captured: Array<Record<string, unknown>> = [];
    const activity = {
      push: ((event: Record<string, unknown>) => {
        captured.push(event);
      }) as unknown as HttpActivityClient['push'],
    };
    const { app } = buildTestApp({ repo: fakeRepo([makeTask({ id })]), activity });
    const ok = await app.inject({ method: 'DELETE', url: `/api/tasks/${id}`, headers: AUTH });
    expect(ok.statusCode).toBe(204);
    const again = await app.inject({ method: 'DELETE', url: `/api/tasks/${id}`, headers: AUTH });
    expect(again.statusCode).toBe(404);
    expect(captured.at(-1)?.action).toBe('task.deleted');
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
