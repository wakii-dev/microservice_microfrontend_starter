// tasks.ts — CRUD /api/tasks theo contracts/openapi/tasks.yaml (operationId
// listTasks/createTask/getTask/updateTask/deleteTask). Prefix mount bởi app
// (/api/tasks — gateway pass-through). Auth guard mount trong plugin này
// (healthz/readyz mirror exempt ở routes/health.ts, không nằm đây).
import type { FastifyInstance } from 'fastify';
import { authGuard } from '../plugins/auth.js';
import type { ActivityEvent, HttpActivityClient, TaskAction } from '../clients/activity.js';
import type { SpringClient } from '../clients/spring.js';
import type { TaskRepo, TaskStatus } from '../repo.js';
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

const taskStatusSchema = { type: 'string', enum: ['todo', 'in_progress', 'done'] } as const;
const uuidSchema = { type: 'string', format: 'uuid' } as const;

interface Deps {
  repo: TaskRepo;
  spring: SpringClient;
  activity: HttpActivityClient;
  jwtSecret: string;
  log: LogFn;
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
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as {
        status?: TaskStatus;
        assigneeId?: string;
        limit: number;
        offset: number;
      };
      const { items, total } = await deps.repo.list({
        status: q.status,
        assigneeId: q.assigneeId,
        limit: q.limit,
        offset: q.offset,
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

      const task = await deps.repo.create({
        title: body.title,
        description: body.description ?? null,
        assigneeId: body.assigneeId ?? null,
        createdBy: user.sub,
      });

      deps.activity.push(
        { taskId: task.id, userId: user.sub, action: 'task.created', timestamp: task.createdAt },
        request.bearerToken,
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
            status: taskStatusSchema,
            assigneeId: uuidSchema,
          },
        },
      },
    },
    async (request) => {
      const { taskId } = request.params as { taskId: string };
      const body = request.body as {
        title?: string;
        description?: string;
        status?: TaskStatus;
        assigneeId?: string;
      };
      const user = request.user!;

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

      const task = await deps.repo.update(taskId, body);
      if (!task) {
        throw new HttpError(404, 'TASK_NOT_FOUND', `Task ${taskId} không tồn tại`);
      }

      pushMutation(deps.activity, task.id, user.sub, 'task.updated', request.bearerToken);
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
    },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string };
      const user = request.user!;
      const deleted = await deps.repo.remove(taskId);
      if (!deleted) {
        throw new HttpError(404, 'TASK_NOT_FOUND', `Task ${taskId} không tồn tại`);
      }
      pushMutation(deps.activity, taskId, user.sub, 'task.deleted', request.bearerToken);
      deps.log('info', 'task deleted', { requestId: request.id, taskId });
      reply.status(204);
      return null;
    },
  );
}

/** fire-and-forget cho update/delete — timestamp lấy lúc mutation (spec §5). */
function pushMutation(
  activity: HttpActivityClient,
  taskId: string,
  userId: string,
  action: TaskAction,
  bearerToken: string | undefined,
): void {
  const event: ActivityEvent = {
    taskId,
    userId,
    action,
    timestamp: new Date().toISOString(),
  };
  activity.push(event, bearerToken);
}
