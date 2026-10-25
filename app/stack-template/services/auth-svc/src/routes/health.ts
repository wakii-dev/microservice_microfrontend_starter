// health.ts — /healthz (liveness) + /readyz (readiness = SELECT 1 thật —
// conventions/02 rule 2, KHÔNG hardcode 200). Đăng ký 2 lần: naked path
// (compose healthcheck + CI boot-smoke) và mirror /api/auth/* (auth.yaml
// servers.url + schemathesis — conventions/02 rule 6). CẢ HAI không-auth.
import type { FastifyInstance } from 'fastify';
import type { AuthRepo } from '../repo.js';

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

export function registerHealthRoutes(app: FastifyInstance, repo: AuthRepo): void {
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
