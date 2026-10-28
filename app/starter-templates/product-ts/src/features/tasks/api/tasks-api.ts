// tasks-api — tầng giao tiếp backend của feature: call qua shared client (base
// URL + timeout + envelope chung) rồi PARSE zod trước khi trả — data sai shape
// vỡ ở ranh giới api, không lan vào UI. Cấm import react (eslint chặn).
import { createQueryKeys } from '@/shared/api/query-keys';
import { apiFetch } from '@/shared/api/client';
import {
  nextTaskStatus,
  taskFormSchema,
  taskSchema,
  type Task,
  type TaskFormValues,
  type TaskStatus,
} from '../schema/schema';

/** Keys TanStack Query của resource tasks — dùng trong hooks (useTasks…). */
export const tasksKeys = createQueryKeys('tasks');

const TASKS_PATH = '/tasks';

export const tasksApi = {
  /** `params` đi thẳng vào query string — dùng cho flag demo (?empty=1/?boom=1). */
  async list(params?: Record<string, string>): Promise<Task[]> {
    const raw = await apiFetch<unknown>(TASKS_PATH, { query: params });
    return taskSchema.array().parse(raw);
  },

  async create(values: TaskFormValues): Promise<Task> {
    const raw = await apiFetch<unknown>(TASKS_PATH, { method: 'POST', body: taskFormSchema.parse(values) });
    return taskSchema.parse(raw);
  },

  /** Đổi task sang trạng thái tiếp theo (todo → doing → done → todo). */
  async toggleStatus(task: Task): Promise<Task> {
    const next: TaskStatus = nextTaskStatus(task.status);
    const raw = await apiFetch<unknown>(`${TASKS_PATH}/${task.id}`, { method: 'PATCH', body: { status: next } });
    return taskSchema.parse(raw);
  },

  /** DELETE trả 204 → client trả undefined. */
  async remove(id: Task['id']): Promise<void> {
    await apiFetch<unknown>(`${TASKS_PATH}/${id}`, { method: 'DELETE' });
  },
};
