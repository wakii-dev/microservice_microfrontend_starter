// kanban/utils — helpers thuần (test được không DOM): nhóm cột · sort · initials
// assignee cho Avatar card. Redesign kit (2026-10-27): drag do KanbanBoard của
// kit đảm nhiệm (native HTML5 DnD + keyboard) — hit-test pickColumn cũ đã bỏ.
import type { Task, TaskStatus } from '../../api';

export const BOARD_COLUMNS: ReadonlyArray<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'Cần làm' },
  { status: 'in_progress', label: 'Đang làm' },
  { status: 'done', label: 'Xong' },
];

export type BoardSort = 'newest' | 'oldest';

/** Nhóm theo cột WRITABLE — assignment_failed KHÔNG nằm trong 3 cột (slim column
 * "Gán thất bại" của board render riêng từ filter). */
export function groupByColumn(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    if (task.status === 'assignment_failed') continue; // slim column riêng — xem board
    grouped[task.status]!.push(task);
  }
  return grouped;
}

/** Sort theo updatedAt (mới nhất/cũ nhất) — không mutate input. */
export function sortTasks(tasks: readonly Task[], sort: BoardSort): Task[] {
  return [...tasks].sort((a, b) => {
    const diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    return sort === 'newest' ? diff : -diff;
  });
}

/** Initials 2 chữ cho Avatar assignee — rút từ đầu id (uuid không có tên thật);
 * null/'' → null (card render "Chưa gán"). */
export function assigneeInitials(assigneeId: string | null | undefined): string | null {
  if (!assigneeId) return null;
  const cleaned = assigneeId.replace(/[^a-z0-9]/gi, '');
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, 2).toUpperCase();
}
