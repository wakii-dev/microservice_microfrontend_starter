// TasksPage — expose `./TasksPage` (registry conventions/08), shell mount vào route /tasks
// (RequireAuth đã lo redirect login; trang này giả định có token, 401 → error banner).
// SF-3 (VU-56) redesign: tách TaskForm/TaskList/TaskItem/StatusSelect (src/components/),
// đủ hành vi API sẵn có — filter status, pagination "Tải thêm", edit inline, delete
// confirm, per-item busy, skeleton/empty primitives. Export default + named GIỮ (MF contract).
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, Skeleton } from '@boilerplate/fe-shared';
import {
  ApiError,
  createTask,
  deleteTask,
  fetchTasks,
  Task,
  TaskStatus,
  updateTask,
} from './api';
import { STATUS_LABELS, WRITABLE_STATUSES } from './components/status';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
// Tokens idempotent (quyết định #5 epic): remote import tokens trong page entry —
// shell (SF-2) cũng import global; nhiều bản cùng giá trị vô hại. KHÔNG import
// base.css ở đây — shell làm chủ global base (bp-* primitives css đi kèm base).
import '@boilerplate/fe-shared/styles/tokens.css';
import './styles.css';

/**
 * CRUD đầy đủ theo context pack SF-3: danh sách + tạo + sửa (status/inline) + xoá +
 * filter + pagination. Error envelope decode → inline banner (conventions/04); KHÔNG
 * toast phức tạp (boilerplate). Per-item busy là state cục bộ của TaskItem.
 */
export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchTasks(statusFilter ? { status: statusFilter } : {});
      setTasks(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore) return;
    setError(null);
    setLoadingMore(true);
    try {
      const params: { offset: number; status?: TaskStatus } = { offset: tasks.length };
      if (statusFilter) params.status = statusFilter;
      const res = await fetchTasks(params);
      setTasks((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreate(input: { title: string; description?: string }) {
    setError(null);
    try {
      await createTask(input);
      await load();
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    setError(null);
    try {
      await updateTask(task.id, { status });
      await load();
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function handleSave(
    task: Task,
    patch: { title?: string; description?: string },
  ) {
    setError(null);
    try {
      await updateTask(task.id, patch);
      await load();
    } catch (err) {
      setError(describeError(err));
    }
  }

  async function handleDelete(task: Task) {
    setError(null);
    try {
      await deleteTask(task.id);
      await load();
    } catch (err) {
      setError(describeError(err));
    }
  }

  function describeError(err: unknown): string {
    if (err instanceof ApiError) {
      // 503 = spring-svc down khi validate user (fail-closed, contract tasks.yaml) — message rõ cho demo
      if (err.status === 503) {
        return 'Dịch vụ xác thực người dùng (spring-svc) chưa sẵn sàng — thử lại sau.';
      }
      return err.message;
    }
    return 'Không kết nối được dịch vụ tasks.';
  }

  return (
    <section className="tsk-page" aria-label="Quản lý tasks">
      <h1 className="tsk-page__title">Tasks</h1>

      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}

      <TaskForm onCreate={handleCreate} />

      <div className="tsk-toolbar" role="group" aria-label="Lọc theo trạng thái">
        <button
          type="button"
          className={`tsk-chip${statusFilter === null ? ' tsk-chip--active' : ''}`}
          aria-pressed={statusFilter === null}
          onClick={() => setStatusFilter(null)}
        >
          Tất cả
        </button>
        {WRITABLE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`tsk-chip${statusFilter === status ? ' tsk-chip--active' : ''}`}
            aria-pressed={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton variant="row" count={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Chưa có task nào"
          description={
            statusFilter
              ? 'Thử bỏ bộ lọc để xem tất cả task.'
              : 'Tạo task đầu tiên ở form trên.'
          }
        />
      ) : (
        <TaskList
          tasks={tasks}
          total={total}
          loadingMore={loadingMore}
          onStatusChange={handleStatusChange}
          onSave={handleSave}
          onDelete={handleDelete}
          onLoadMore={() => void loadMore()}
        />
      )}
    </section>
  );
}
export default TasksPage;
