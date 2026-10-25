// tasks.ts — CRUD /api/tasks theo contracts/openapi/tasks.yaml (operationId
// listTasks/createTask/getTask/updateTask/deleteTask). Prefix mount bởi app
// (/api/tasks — gateway pass-through). Auth guard mount trong plugin này
// (healthz/readyz mirror exempt ở routes/health.ts, không nằm đây).
//
// SF-2 (FI-79): event push HTTP (ADR-0006) THAY BẰNG transactional outbox —
// route build outbox op theo event matrix PRESENCE-BASED (ADR-0008: body có
// assigneeId = bắn task.assigned, kể cả same-value; KHÔNG value-compare), repo
// ghi task + outbox trong CÙNG 1 tx. Relay publish riêng (outbox-relay.ts).
import type { FastifyInstance } from 'fastify';
import { authGuard } from '../plugins/auth.js';
import type { SpringClient } from '../clients/spring.js';
import type { OutboxEventInput, TaskPatch, TaskRepo, TaskStatus } from '../repo.js';
import type { LogFn } from '../types/log.js';

export class HttpError extends Error {
  // statusCode (không phải status) — tên fastify error handler đọc
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

// WRITABLE 3 giá trị — query param + PATCH body (tasks.yaml TaskStatus).
// Response nới qua TaskStatusExtended (repo Task.status) — GET chấp nhận
// 'assignment_failed' do compensation consumer ghi (system-owned).
const taskStatusSchema = { type: 'string', enum: ['todo', 'in_progress', 'done'] } as const;
const uuidSchema = { type: 'string', format: 'uuid' } as const;

interface Deps {
  repo: TaskRepo;
  spring: SpringClient;
  jwtSecret: string;
  log: LogFn;
}

/**
 * Event matrix PRESENCE-BASED (epic spec rev 2/3 — ADR-0008):
 * - PATCH có `assigneeId` trong body → `task.assigned` (+ `task.updated` nếu
 *   body còn field khác, kể cả description);
 * - PATCH không có `assigneeId` → `task.updated`;
 * - KHÔNG có unassign/null (schema không nhận null — spec ghi rõ);
 * - payload `task.updated` chỉ title/status/assigneeId (task-events.md —
 *   description KHÔNG nằm trong payload).
 */
export function buildPatchEvents(
  taskId: string,
  userId: string,
  body: TaskPatch,
): OutboxEventInput[] {
  const updatedPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = { taskId, userId };
    if (body.title !== undefined) payload.title = body.title;
    if (body.status !== undefined) payload.status = body.status;
    if (body.assigneeId !== undefined) payload.assigneeId = body.assigneeId;
    return payload;
  };

  if (body.assigneeId !== undefined) {
    const events: OutboxEventInput[] = [
      {
        type: 'task.assigned',
        payload: { taskId, userId, assigneeId: body.assigneeId },
      },
    ];
    const hasOtherField =
      body.title !== undefined || body.status !== undefined || body.description !== undefined;
    if (hasOtherField) {
      events.push({ type: 'task.updated', payload: updatedPayload() });
    }
    return events;
  }
  return [{ type: 'task.updated', payload: updatedPayload() }];
}

export function registerTaskRoutes(app: FastifyInstance, deps: Deps): void {
  app.addHook('onRequest', authGuard(deps.jwtSecret));

  app.get(
    '/',
    {
      schema: {
        operationId: 'listTasks',
        querystring: {
          type: 'object',
          properties: {
            status: taskStatusSchema,
            assigneeId: uuidSchema,
            q: { type: 'string', maxLength: 200 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request) => {
      const query = request.query as {
        status?: TaskStatus;
        assigneeId?: string;
        q?: string;
        limit: number;
        offset: number;
      };
      // q: trim tại biên API; rỗng sau trim = không filter (repo escape + ILIKE).
      const search = query.q?.trim() || undefined;
      const { items, total } = await deps.repo.list({
        status: query.status,
        assigneeId: query.assigneeId,
        q: search,
        limit: query.limit,
        offset: query.offset,
      });
      return { items, total };
    },
  );

  app.get(
    '/:taskId',
    {
      schema: {
        operationId: 'getTask',
        params: { type: 'object', required: ['taskId'], properties: { taskId: uuidSchema } },
      },
    },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string };
      const task = await deps.repo.getById(taskId);
      if (!task) {
        throw new HttpError(404, 'TASK_NOT_FOUND', `Task ${taskId} không tồn tại`);
      }
      return task;
    },
  );

  app.post(
    '/',
    {
      schema: {
        operationId: 'createTask',
        body: {
          type: 'object',
          required: ['title'],
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string' },
            assigneeId: uuidSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { title: string; description?: string; assigneeId?: string };
      const user = request.user!;

      // Fail-closed user validation (spec §4): spring down/timeout → 503,
      // không ghi nửa chừng. assignee KHÔNG tồn tại → 422.
      if (body.assigneeId) {
        const validation = await deps.spring.validateUser(body.assigneeId, request.bearerToken);
        if (validation === 'down') {
          throw new HttpError(
            503,
            'DEPENDENCY_DOWN',
            'spring-svc unavailable — cannot validate assignee (fail-closed)',
          );
        }
        if (validation === 'not_found') {
          throw new HttpError(422, 'UNPROCESSABLE', `Assignee ${body.assigneeId} không tồn tại`);
        }
      }

      // taskId do route sinh TRƯỚC (payload event cần taskId, event ghi CÙNG tx
      // với insert task) — repo dùng id này (DDL: id app-generated uuid v4).
      const taskId = crypto.randomUUID();
      const events: OutboxEventInput[] = [
        {
          type: 'task.created',
          payload: {
            taskId,
            userId: user.sub,
            title: body.title,
            status: 'todo',
            ...(body.assigneeId ? { assigneeId: body.assigneeId } : {}),
          },
        },
      ];
      const task = await deps.repo.create(
        {
          id: taskId,
          title: body.title,
          description: body.description ?? null,
          assigneeId: body.assigneeId ?? null,
          createdBy: user.sub,
        },
        events,
      );

      deps.log('info', 'task created', { requestId: request.id, taskId: task.id });
      reply.status(201);
      return task;
    },
  );

  app.patch(
    '/:taskId',
    {
      schema: {
        operationId: 'updateTask',
        params: { type: 'object', required: ['taskId'], properties: { taskId: uuidSchema } },
        body: {
          type: 'object',
          minProperties: 1,
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string' },
            status: taskStatusSchema, // WRITABLE 3 — PATCH KHÔNG nhận assignment_failed
            assigneeId: uuidSchema,
          },
        },
      },
    },
    async (request) => {
      const { taskId } = request.params as { taskId: string };
      const body = request.body as TaskPatch;
      const user = request.user!;

      // presence-based; schema PATCH chỉ nhận uuid string (null bị 400 validation
      // ở schema layer — check này chỉ thu hẹp type, KHÔNG đổi semantics)
      const assigneeId = body.assigneeId;
      if (assigneeId !== undefined && assigneeId !== null) {
        const validation = await deps.spring.validateUser(assigneeId, request.bearerToken);
        if (validation === 'down') {
          throw new HttpError(
            503,
            'DEPENDENCY_DOWN',
            'spring-svc unavailable — cannot validate assignee (fail-closed)',
          );
        }
        if (validation === 'not_found') {
          throw new HttpError(422, 'UNPROCESSABLE', `Assignee ${assigneeId} không tồn tại`);
        }
      }

      const task = await deps.repo.update(taskId, body, buildPatchEvents(taskId, user.sub, body));
      if (!task) {
        throw new HttpError(404, 'TASK_NOT_FOUND', `Task ${taskId} không tồn tại`);
      }

      deps.log('info', 'task updated', { requestId: request.id, taskId: task.id });
      return task;
    },
  );

  app.delete(
    '/:taskId',
    {
      schema: {
        operationId: 'deleteTask',
        params: { type: 'object', required: ['taskId'], properties: { taskId: uuidSchema } },
      },
      // RBAC demo (epic auth-real SF-3): DELETE admin-only — pattern 2-lớp,
      // gateway chỉ presence-check, service TỰ enforce roles claim (đã decode
      // ở plugins/auth.ts). Guard chặn TRƯỚC repo — fail-closed: không xoá,
      // không bắn task.deleted. 403 envelope qua error handler chung (04).
      preHandler: async (request) => {
        const user = request.user!;
        if (!user.roles?.includes('admin')) {
          throw new HttpError(403, 'FORBIDDEN', 'Chỉ admin được xoá task');
        }
      },
    },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string };
      const user = request.user!;
      const events: OutboxEventInput[] = [
        { type: 'task.deleted', payload: { taskId, userId: user.sub } },
      ];
      const deleted = await deps.repo.remove(taskId, events);
      if (!deleted) {
        throw new HttpError(404, 'TASK_NOT_FOUND', `Task ${taskId} không tồn tại`);
      }
      deps.log('info', 'task deleted', { requestId: request.id, taskId });
      reply.status(204);
      return null;
    },
  );
}
