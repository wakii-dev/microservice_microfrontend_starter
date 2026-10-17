// Status vocabulary chung cho components tasks (SF-3, VU-56).
// STATUS_LABELS là test contract — KHÔNG đổi text (context pack boundary).
// `assignment_failed` là status hệ thống (saga compensation): HIỂN THỊ badge,
// KHÔNG cho chọn trong select — PATCH cấm (contract tasks.yaml TaskStatusExtended).
import type { BadgeVariant } from '@wakii/fe-shared';
import type { TaskStatus, TaskStatusExtended } from '../api';

export const STATUS_LABELS: Record<TaskStatusExtended, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Xong',
  assignment_failed: 'Gán thất bại',
};

export const WRITABLE_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

/** Map status → variant Badge primitive (hand-off §3: todo/doing/done/failed). */
export const STATUS_VARIANTS: Record<TaskStatusExtended, BadgeVariant> = {
  todo: 'todo',
  in_progress: 'doing',
  done: 'done',
  assignment_failed: 'failed',
};
