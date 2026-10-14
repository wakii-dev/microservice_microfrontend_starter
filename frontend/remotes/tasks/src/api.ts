// API layer remote `tasks` — gọi /api/tasks (node-svc) theo contract contracts/openapi/tasks.yaml.
// Base URL build-time (conventions/06): dev native = http://localhost:3001 (node-svc trực tiếp,
// CORS dev mở — conventions/07); prod = '' (same-origin qua gateway, pass-through giữ prefix /api/tasks).
// JWT + error envelope do fe-shared ApiClient (READ-ONLY) lo — token đọc từ tokenStorage (cùng origin
// với shell vì remote render TRONG shell).
import { ApiClient, ApiError, tokenStorage } from '@boilerplate/fe-shared';

const TIMEOUT_MS = 10_000;

/** Wrap fetch với AbortController timeout — không timeout = UI treo vô hạn khi node-svc chết
 * (mirror shell/src/api.ts — fe-shared ApiClient không có AbortSignal sẵn).
 * fetchImpl bind LAZY tại call-time (khác shell 1 chút): vi.stubGlobal('fetch') trong unit test
 * có hiệu lực; prod hành vi như cũ. */
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

/** Mirror Task schema trong contracts/openapi/tasks.yaml — TaskStatus
 * (writable, query/PATCH) vs TaskStatusExtended (response, SF-2 cascade thêm
 * `assignment_failed` — status hệ thống do saga compensation ghi, PATCH CẤM). */
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskStatusExtended = TaskStatus | 'assignment_failed';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusExtended;
  assigneeId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  items: Task[];
  total: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

// Path giữ nguyên prefix /api/tasks — node-svc tự mount prefix (gateway pass-through, không rewrite).
// SF-3 (VU-56): params limit/offset/status theo contract tasks.yaml — listTasks query
// (limit min 1 max 100, offset min 0, status CHỈ writable TaskStatus). Clamp tại đây
// để UI không bao giờ gửi query vi phạm contract dù state có lệch.

/** Kích thước trang "Tải thêm" — chọn 10 để pagination thấy được ngay trong demo. */
export const TASKS_PAGE_SIZE = 10;

export interface FetchTasksParams {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
}

function buildTasksPath(params: FetchTasksParams = {}): string {
  const limit = Math.min(Math.max(params.limit ?? TASKS_PAGE_SIZE, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (params.status) {
    query.set('status', params.status);
  }
  return `/api/tasks?${query.toString()}`;
}

export function fetchTasks(params: FetchTasksParams = {}): Promise<TaskList> {
  return api.get<TaskList>(buildTasksPath(params));
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return api.post<Task>('/api/tasks', input);
}

export function updateTask(taskId: string, patch: UpdateTaskInput): Promise<Task> {
  return api.patch<Task>(`/api/tasks/${taskId}`, patch);
}

export function deleteTask(taskId: string): Promise<void> {
  return api.delete(`/api/tasks/${taskId}`);
}

export { ApiError };
