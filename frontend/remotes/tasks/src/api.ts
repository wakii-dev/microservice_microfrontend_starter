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

/** Mirror Task schema trong contracts/openapi/tasks.yaml */
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
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

// Path giữ nguyên prefix /api/tasks — node-svc tự mount prefix (gateway pass-through, không rewrite)
export function fetchTasks(): Promise<TaskList> {
  return api.get<TaskList>('/api/tasks?limit=50');
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return api.post<Task>('/api/tasks', input);
}

export function updateTask(taskId: string, patch: UpdateTaskInput): Promise<Task> {
  return api.patch<Task>(`/api/tasks/${taskId}`, patch);
}

export { ApiError };
