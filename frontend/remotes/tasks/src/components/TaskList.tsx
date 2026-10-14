// TaskList — heading "x/total" (format là test contract) + ul "Danh sách tasks" + nút
// "Tải thêm" (chỉ khi đã tải < total). Load-more dùng nút busy, KHÔNG skeleton — tránh
// list nhảy layout.
import type { Task, TaskStatus } from '../api';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  total: number;
  loadingMore: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onSave: (task: Task, patch: { title?: string; description?: string }) => Promise<boolean>;
  onDelete: (task: Task) => Promise<void>;
  onLoadMore: () => void;
}

export function TaskList({
  tasks,
  total,
  loadingMore,
  onStatusChange,
  onSave,
  onDelete,
  onLoadMore,
}: TaskListProps) {
  return (
    <>
      <h2 className="tsk-list__heading">
        Danh sách ({tasks.length}/{total})
      </h2>
      <ul className="tsk-list" aria-label="Danh sách tasks">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onSave={onSave}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {tasks.length < total && (
        <button
          type="button"
          className="tsk-btn tsk-btn--ghost tsk-load"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Đang tải thêm…' : 'Tải thêm'}
        </button>
      )}
    </>
  );
}
