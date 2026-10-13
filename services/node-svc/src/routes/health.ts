// health.ts — /healthz (liveness) + /readyz (readiness), conventions/02.
// Đăng ký 2 lần: naked path (compose healthcheck + boot-smoke + gateway
// KHÔNG route) và mirror /api/tasks/* (tasks.yaml servers.url — contract
// fixtures chạy được; pattern auth-mock). CẢ HAI không-auth.
// readyz = DB migrated + SELECT 1 ok (hard gate); spring check boot-time
// warn-only (deviation D3 — xem README; fail-closed enforce ở request-time).
import type { FastifyInstance } from 'fastify';
import type { TaskRepo } from '../repo.js';

function healthBody(): { status: 'ok' } {
  return { status: 'ok' };
}

function notReady(): {
  error: { code: string; message: string; requestId: string | null; details: null };
} {
  return {
    error: {
      code: 'DEPENDENCY_DOWN',
      message: 'database not ready',
      requestId: null,
      details: null,
    },
  };
}

export function registerHealthRoutes(app: FastifyInstance, repo: TaskRepo): void {
  app.get('/healthz', async () => healthBody());

  app.get(
    '/readyz',
    async (_request, reply) => {
      try {
        await repo.ping();
        return healthBody();
      } catch {
        reply.status(503);
        return notReady();
      }
    },
  );
}
