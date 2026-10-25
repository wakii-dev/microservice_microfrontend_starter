// TaskList — heading "x/total" (format là test contract) + ul "Danh sách tasks" + nút
// "Tải thêm" (chỉ khi đã tải < total). Load-more dùng nút busy, KHÔNG skeleton — tránh
// list nhảy layout.
// Motion redesign: ul variants staggerChildren — item xuất hiện lần lượt; items nằm
// trong AnimatePresence → item MỚI/XOÁ có enter/exit (exit = collapse + fade, xem
// TaskItem). Load-more nối thêm vẫn được stagger (delay theo index trong trang mới —
// TaskItem tự nhân delay index trang cục bộ).
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@wakii/ui-kit';
import type { Task, TaskStatus } from '../api';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  total: number;
  /** F2 (review VU-53): page đã tải < total CHƯA chắc còn data — server có thể trả
   * trang rỗng (row chưa tải đã bị xoá). hasMore do page tính (kèm cờ exhausted). */
  hasMore: boolean;
  loadingMore: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onSave: (task: Task, patch: { title?: string; description?: string }) => Promise<boolean>;
  onDelete: (task: Task) => Promise<void>;
  onLoadMore: () => void;
}

export function TaskList({
  tasks,
  total,
  hasMore,
  loadingMore,
  onStatusChange,
  onSave,
  onDelete,
  onLoadMore,
}: TaskListProps) {
  return (
    <>
      <h2 className="m-0 text-h2 text-ink2">
        Danh sách ({tasks.length}/{total})
      </h2>
      <ul className="tsk-list" aria-label="Danh sách tasks">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onStatusChange={onStatusChange}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </ul>
      {hasMore && (
        <Button
          type="text"
          className="self-start"
          onClick={onLoadMore}
          disabled={loadingMore}
          icon={<Icon name="chevron-down" />}
        >
          {loadingMore ? 'Đang tải thêm…' : 'Tải thêm'}
        </Button>
      )}
    </>
  );
}
