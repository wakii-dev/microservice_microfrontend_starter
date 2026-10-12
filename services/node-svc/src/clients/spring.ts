// spring.ts — user-validation client (spec §4): GET {SPRING_SVC_URL}/api/users/{id}
// timeout 2s. Kết quả 3 trạng thái — route map: ok→ghi, not_found→422, down→503 fail-closed.
import type { LogFn } from '../types/log.js';

export const USER_VALIDATE_TIMEOUT_MS = 2000;

export type UserValidation = 'ok' | 'not_found' | 'down';

export interface SpringClient {
  validateUser(userId: string, bearerToken: string | undefined): Promise<UserValidation>;
  /** boot-time reachability check 1 lần (readyz deviation D3 — warn-only) */
  ping(): Promise<boolean>;
}

export class HttpSpringClient implements SpringClient {
  constructor(
    private readonly baseUrl: string,
    private readonly log?: LogFn,
  ) {}

  async validateUser(userId: string, bearerToken: string | undefined): Promise<UserValidation> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: bearerToken ? { authorization: `Bearer ${bearerToken}` } : {},
        signal: AbortSignal.timeout(USER_VALIDATE_TIMEOUT_MS),
      });
    } catch (err) {
      this.log?.('warn', 'user validation request failed', {
        userId,
        err: err instanceof Error ? err.message : String(err),
      });
      return 'down';
    }
    if (res.status === 200) return 'ok';
    if (res.status === 404) return 'not_found';
    // status khác (401/500/…) — coi dependency đang bất thường → fail-closed
    this.log?.('warn', 'user validation unexpected status', { userId, status: res.status });
    return 'down';
  }

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/healthz`, {
        signal: AbortSignal.timeout(USER_VALIDATE_TIMEOUT_MS),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
