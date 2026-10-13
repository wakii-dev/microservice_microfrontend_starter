// activity.ts — event push fire-and-forget (spec §5): KHÔNG await (đáp trả
// ngay sau DB commit), AbortSignal.timeout 2s (không leak socket khi go-svc
// hang), fail → pino warn "event push failed", KHÔNG retry (ADR: trade-off
// chấp nhận mất event khi go-svc down — task mutation vẫn thành công).
import type { LogFn } from '../types/log.js';

export const EVENT_PUSH_TIMEOUT_MS = 2000;

export type TaskAction = 'task.created' | 'task.updated' | 'task.deleted';

export interface ActivityEvent {
  taskId: string;
  userId: string;
  action: TaskAction;
  timestamp: string; // ISO 8601 UTC — thời điểm mutation tại node-svc
}

export class HttpActivityClient {
  constructor(
    private readonly baseUrl: string,
    private readonly log: LogFn,
  ) {}

  /** Fire-and-forget: caller KHÔNG await; promise tự catch → warn log. */
  push(event: ActivityEvent, bearerToken: string | undefined): void {
    void (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/activity/events`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(bearerToken ? { authorization: `Bearer ${bearerToken}` } : {}),
          },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(EVENT_PUSH_TIMEOUT_MS),
        });
        if (!res.ok && res.status !== 202) {
          this.log('warn', 'event push failed', { taskId: event.taskId, status: res.status });
        }
      } catch (err) {
        this.log('warn', 'event push failed', {
          taskId: event.taskId,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }
}
