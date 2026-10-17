// API layer remote `activity` — gọi /api/activity (go-svc) theo contract contracts/openapi/activity.yaml.
// Base URL build-time (conventions/06): dev native = http://localhost:8082 (go-svc trực tiếp,
// CORS dev mở — conventions/07); prod = '' (same-origin qua gateway, pass-through giữ prefix).
// JWT + error envelope do fe-shared ApiClient (READ-ONLY) lo.
import { ApiClient, ApiError, tokenStorage } from '@wakii/fe-shared';

const TIMEOUT_MS = 10_000;

/** Wrap fetch với AbortController timeout — không timeout = UI treo vô hạn khi go-svc chết
 * (mirror remote tasks — fetchImpl bind LAZY tại call-time để vi.stubGlobal có hiệu lực). */
export function timeoutFetch(timeoutMs: number, fetchImpl?: typeof fetch): typeof fetch {
  return (input, init = {}) => {
    const doFetch = fetchImpl ?? fetch.bind(globalThis);
    if (init.signal) {
      // caller tự quản signal — không override
      return doFetch(input, init);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`timeout ${timeoutMs}ms`)), timeoutMs);
    return doFetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}

export const api = new ApiClient({
  baseUrl: __API_BASE_URL__,
  tokenStorage,
  fetchImpl: timeoutFetch(TIMEOUT_MS),
});

/** Mirror ActivityFeedItem/ActivityStats schema trong contracts/openapi/activity.yaml */
export interface ActivityFeedItem {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  timestamp: string;
  /** User-display field — go-svc resolve, FE render TRỰC TIẾP (spec slice mục 4, không tự bịa) */
  userName: string;
  taskTitle: string;
}

export interface ActivityFeed {
  items: ActivityFeedItem[];
  total: number;
}

export interface ActivityStats {
  totalTasks: number;
  /** 4 giá trị khớp CHECK canonical DDL — assignment_failed do saga compensation ghi (SF-3) */
  tasksByStatus: { todo: number; in_progress: number; done: number; assignment_failed: number };
  recentEvents?: number;
}

// Path giữ nguyên prefix /api/activity — go-svc tự mount prefix (gateway pass-through)
export function fetchFeed(): Promise<ActivityFeed> {
  return api.get<ActivityFeed>('/api/activity/feed?limit=20');
}

export function fetchStats(): Promise<ActivityStats> {
  return api.get<ActivityStats>('/api/activity/stats');
}

export { ApiError };
