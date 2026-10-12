// TasksPage — expose `./TasksPage` (registry conventions/08), shell mount vào route /tasks
// (RequireAuth đã lo redirect login; trang này giả định có token, 401 → error banner).
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ApiError, createTask, fetchTasks, Task, TaskStatus, updateTask } from './api';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Xong',
};
const STATUSES = Object.keys(STATUS_LABELS) as TaskStatus[];

/**
 * CRUD tối giản theo spec slice mục 3: danh sách + tạo + sửa (đổi status).
 * Error envelope decode → inline banner (conventions/04); KHÔNG toast phức tạp (boilerplate).
 */
export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchTasks();
      setTasks(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await createTask({ title: title.trim(), description: description.trim() || undefined });
      setTitle('');
      setDescription('');
      await load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
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
    <section aria-label="Quản lý tasks">
      <h1>Tasks</h1>

      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} aria-label="Form tạo task">
        <label>
          Tiêu đề
          <input
            type="text"
            name="title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          Mô tả
          <input
            type="text"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Đang tạo…' : 'Tạo task'}
        </button>
      </form>

      {loading ? (
        <p>Đang tải tasks…</p>
      ) : tasks.length === 0 ? (
        <p>Chưa có task nào — tạo task đầu tiên ở form trên.</p>
      ) : (
        <>
          <h2>
            Danh sách ({tasks.length}/{total})
          </h2>
          <ul aria-label="Danh sách tasks" style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.4rem 0' }}
              >
                <strong>{task.title}</strong>
                {task.description && <span>— {task.description}</span>}
                <label style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                  {' '}
                  Trạng thái
                  <select
                    aria-label={`Trạng thái task ${task.title}`}
                    value={task.status}
                    onChange={(e) => void handleStatusChange(task, e.target.value as TaskStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
