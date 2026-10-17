// TaskItem — card layout responsive (hand-off §4 task row): status pill/spinner + title/desc
// + meta phải mono (assignee UUID rút gọn + createdAt vi-VN) + actions (select/sửa/xoá).
// Busy per-item: Spinner THAY badge + disable select/actions khi PATCH/DELETE đang bay.
// Edit inline 2 mode + confirm xoá 2 bước — busy/editing/confirming là state CỤC BỘ item.
import { FormEvent, useState } from 'react';
import { Spinner } from '@wakii/fe-shared';
import type { Task, TaskStatus } from '../api';
import { StatusBadge } from './StatusBadge';
import { StatusSelect } from './StatusSelect';

interface TaskItemProps {
  task: Task;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  /** true = lưu OK — chỉ khi đó thoát edit (lỗi → banner ở page + giữ form + draft). */
  onSave: (task: Task, patch: { title?: string; description?: string }) => Promise<boolean>;
  onDelete: (task: Task) => Promise<void>;
}

/** UUID rút gọn 8 ký tự đầu — tooltip giữ full (KHÔNG resolve tên qua /api/users). */
function shortUuid(id: string): string {
  return `${id.slice(0, 8)}…`;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
}

export function TaskItem({ task, onStatusChange, onSave, onDelete }: TaskItemProps) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description ?? '');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setDraftTitle(task.title);
    setDraftDescription(task.description ?? '');
    setConfirming(false);
    setEditing(true);
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title || busy) return;
    // Chỉ gửi field THAY ĐỔI (UpdateTaskRequest minProperties 1); description rỗng
    // gửi '' — contract cho phép, user xoá được mô tả.
    const patch: { title?: string; description?: string } = {};
    if (title !== task.title) patch.title = title;
    if ((task.description ?? '') !== draftDescription) patch.description = draftDescription;
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    void run(async () => {
      const ok = await onSave(task, patch);
      if (ok) setEditing(false);
    });
  }

  return (
    <li className="tsk-item">
      <div className="tsk-item__status">
        {busy ? (
          <Spinner label={`Đang xử lý task ${task.title}`} />
        ) : (
          <StatusBadge title={task.title} status={task.status} />
        )}
      </div>

      <div className="tsk-item__main">
        {editing ? (
          <form className="tsk-item__edit" onSubmit={saveEdit}>
            <input
              type="text"
              className="tsk-item__edit-title"
              aria-label={`Sửa tiêu đề task ${task.title}`}
              required
              maxLength={200}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
            <input
              type="text"
              className="tsk-item__edit-desc"
              aria-label={`Sửa mô tả task ${task.title}`}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
            />
            <button type="submit" className="tsk-btn tsk-btn--primary" disabled={busy}>
              Lưu
            </button>
            <button
              type="button"
              className="tsk-btn tsk-btn--ghost"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Huỷ
            </button>
          </form>
        ) : (
          <>
            <h3 className="tsk-item__title">{task.title}</h3>
            {task.description && <p className="tsk-item__desc">{task.description}</p>}
          </>
        )}
      </div>

      <div className="tsk-item__side">
        <p className="tsk-item__meta">
          {task.assigneeId ? (
            <code className="tsk-item__uuid" title={task.assigneeId}>
              {shortUuid(task.assigneeId)}
            </code>
          ) : (
            <span className="tsk-item__uuid">Chưa gán</span>
          )}
          <span className="tsk-item__meta-dot" aria-hidden="true">
            ·
          </span>
          <time className="tsk-item__time" dateTime={task.createdAt}>
            {formatDate(task.createdAt)}
          </time>
        </p>

        {task.status !== 'assignment_failed' && (
          // Status hệ thống — KHÔNG select (PATCH cấm assignment_failed)
          <StatusSelect
            task={task}
            disabled={busy}
            onChange={(status) => void run(() => onStatusChange(task, status))}
          />
        )}

        {editing ? null : confirming ? (
          <div className="tsk-item__confirm">
            <span className="tsk-item__confirm-text">Xoá task này?</span>
            <button
              type="button"
              className="tsk-btn tsk-btn--danger"
              disabled={busy}
              onClick={() => void run(() => onDelete(task))}
            >
              Xác nhận xoá
            </button>
            <button
              type="button"
              className="tsk-btn tsk-btn--ghost"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Huỷ
            </button>
          </div>
        ) : (
          <div className="tsk-item__actions">
            <button
              type="button"
              className="tsk-btn tsk-btn--ghost"
              aria-label={`Sửa task ${task.title}`}
              disabled={busy}
              onClick={startEdit}
            >
              Sửa
            </button>
            <button
              type="button"
              className="tsk-btn tsk-btn--danger-ghost"
              aria-label={`Xoá task ${task.title}`}
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              Xoá
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
