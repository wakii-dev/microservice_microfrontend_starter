// kanban/utils — helpers thuần (test được không DOM): nhóm cột · sort · hit-test
// điểm thả card. assignment_failed là status HỆ THỐNG (PATCH cấm) — card hiển thị
// ở ĐẦU cột 'Cần làm' (workflow: task bị saga trả về = quay về cần làm) với badge
// failed + KHÔNG kéo (không bao giờ gọi PATCH).
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

/**
 * Hit-test điểm thả (toạ độ viewport — framer `info.point` cùng hệ với
 * getBoundingClientRect) vào các cột. Trúng cột nào trả status đó; không trúng
 * → null (card snap về chỗ cũ, không mutation).
 */
export function pickColumn(
  point: { x: number; y: number },
  rects: Record<string, DOMRect | null | undefined>,
): TaskStatus | null {
  for (const [status, rect] of Object.entries(rects)) {
    if (!rect) continue;
    if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
      return status as TaskStatus;
    }
  }
  return null;
}
