// TasksPage — expose `./TasksPage` (registry conventions/08), shell mount vào route /tasks
// (RequireAuth đã lo redirect login; trang này giả định có token, 401 → error banner).
// SF-3 (VU-56) redesign: tách TaskForm/TaskList/TaskItem/StatusSelect (src/components/),
// đủ hành vi API sẵn có — filter status, pagination "Tải thêm", edit inline, delete
// confirm, per-item busy, skeleton/empty primitives. Export default + named GIỮ (MF contract).
import { useCallback, useEffect, useRef, useState } from 'react';
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
  // F2 (review VU-53): server trả trang RỖNG khi các row chưa tải đã bị xoá hết —
  // tasks.length < total vẫn true mãi → nút "Tải thêm" click vô hạn không load được gì.
  const [pagesExhausted, setPagesExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  // Sequence guard chống race stale-response: load-more in-flight + user đổi filter →
  // response cũ về sau phải bị bỏ (không append vào list đã filter, không ghi đè total).
  const reqSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++reqSeq.current;
    // load mới supersede mọi load-more in-flight — nút "Tải thêm" không được kẹt disabled
    setLoadingMore(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetchTasks(statusFilter ? { status: statusFilter } : {});
      if (seq !== reqSeq.current) return;
      setTasks(res.items);
      setTotal(res.total);
    } catch (err) {
      if (seq !== reqSeq.current) return;
      setError(describeError(err));
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setPagesExhausted(false);
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore) return;
    const seq = ++reqSeq.current;
    setError(null);
    setLoadingMore(true);
    try {
      const params: { offset: number; status?: TaskStatus } = { offset: tasks.length };
      if (statusFilter) params.status = statusFilter;
      const res = await fetchTasks(params);
      if (seq !== reqSeq.current) return;
      setTasks((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      // F2: trang rỗng = hết data thật phía server — ẩn nút thay vì để click không hồi kết
      if (res.items.length === 0) setPagesExhausted(true);
    } catch (err) {
      if (seq !== reqSeq.current) return;
      setError(describeError(err));
    } finally {
      if (seq === reqSeq.current) setLoadingMore(false);
    }
  }

  // ── F3 (review VU-53): mutations cập nhật IN-PLACE từ response của chính nó —
  // KHÔNG load() full (skeleton thay cả list unmount mọi TaskItem → mất draft edit
  // inline / confirm xoá đang mở ở dòng khác). Server response = nguồn sự thật từng item;
  // load() chỉ cho initial + đổi filter. Ghi chú: offset pagination trên list mutable
  // có thể skip/dup nếu session khác xoá/tạo giữa chừng — khắc phục triệt để cần
  // keyset pagination (đổi contract tasks.yaml) — ngoài scope FE fix này.

  /** true = tạo OK — form chỉ xoá input khi true (lỗi → giữ draft user). */
  async function handleCreate(input: { title: string; description?: string }): Promise<boolean> {
    setError(null);
    try {
      const created = await createTask(input);
      setTotal((t) => t + 1);
      // filter đang bật và task mới không thuộc → chỉ tăng total, không chèn vào list
      if (!statusFilter || created.status === statusFilter) {
        setTasks((prev) => [created, ...prev]);
      }
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    setError(null);
    try {
      const updated = await updateTask(task.id, { status });
      // item rơi khỏi filter đang bật → remove khỏi list (total giảm theo)
      if (statusFilter && updated.status !== statusFilter) {
        setTasks((prev) => prev.filter((t) => t.id !== updated.id));
        setTotal((t) => t - 1);
      } else {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      }
    } catch (err) {
      setError(describeError(err));
    }
  }

  /** true = PATCH OK — item chỉ thoát edit khi true (lỗi → giữ form + draft).
   * Save không đổi status → không tương tác filter, replace in-place. */
  async function handleSave(
    task: Task,
    patch: { title?: string; description?: string },
  ): Promise<boolean> {
    setError(null);
    try {
      const updated = await updateTask(task.id, patch);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    }
  }

  async function handleDelete(task: Task) {
    setError(null);
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTotal((t) => t - 1);
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
          hasMore={tasks.length < total && !pagesExhausted}
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
