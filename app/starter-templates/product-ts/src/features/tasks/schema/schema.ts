// schema — zod là nguồn sự thật: parse response API (runtime) + type TS
// (compile) + validate form. Sửa shape task = sửa DUY NHẤT file này.
import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'doing', 'done']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  status: taskStatusSchema,
  assignee: z.string().nullable(),
  createdAt: z.string(),
});
export type Task = z.infer<typeof taskSchema>;

/** Form tạo task — recipe useForm kit: schema zod truyền thẳng vào useForm. */
export const taskFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề bắt buộc').max(120, 'Tiêu đề tối đa 120 ký tự'),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Chu kỳ trạng thái khi toggle: todo → doing → done → todo. */
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  return status === 'todo' ? 'doing' : status === 'doing' ? 'done' : 'todo';
}

/** Nhãn tiếng Việt cho status — dùng chung Table/Tag. */
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  doing: 'Đang làm',
  done: 'Xong',
};
