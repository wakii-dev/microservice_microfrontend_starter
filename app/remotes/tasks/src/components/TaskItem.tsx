// TaskItem — card layout responsive (hand-off §4 task row): status pill/spinner + title/desc
// + meta phải mono (assignee UUID rút gọn + createdAt vi-VN) + actions (select/sửa/xoá).
// Busy per-item: Spinner THAY badge + disable select/actions khi PATCH/DELETE đang bay.
// Edit inline 2 mode + confirm xoá 2 bước — busy/editing/confirming là state CỤC BỘ item.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Popconfirm, Spinner } from '@wakii/ui-kit';
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
  // RHF: draft edit inline — reset(task) mỗi lần mở edit (đúng giá trị hiện tại);
  // chỉ gửi field THAY ĐỔI; lỗi (onSave false) → giữ nguyên form + draft.
  const { register, handleSubmit, reset, getValues } = useForm({
    defaultValues: { title: task.title, description: task.description ?? '' },
  });

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    reset({ title: task.title, description: task.description ?? '' });
    setConfirming(false);
    setEditing(true);
  }

  function saveEdit() {
    const values = getValues();
    const title = values.title.trim();
    if (!title || busy) return;
    // Chỉ gửi field THAY ĐỔI (UpdateTaskRequest minProperties 1); description rỗng
    // gửi '' — contract cho phép, user xoá được mô tả.
    const patch: { title?: string; description?: string } = {};
    if (title !== task.title) patch.title = title;
    if ((task.description ?? '') !== values.description) patch.description = values.description;
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
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-3 border border-line bg-s2 p-3 px-4 transition-colors hover:bg-s3 max-md:grid-cols-1">
      <div className="flex min-h-[22px] items-center pt-0.5">
        {busy ? (
          <Spinner label={`Đang xử lý task ${task.title}`} />
        ) : (
          <StatusBadge title={task.title} status={task.status} />
        )}
      </div>

      <div className="tsk-item__main">
        {editing ? (
          <form className="flex w-full flex-row flex-wrap gap-2" onSubmit={handleSubmit(saveEdit)}>
            <Input
              className="min-w-0 flex-1"
              aria-label={`Sửa tiêu đề task ${task.title}`}
              required
              maxLength={200}
              {...register('title')}
            />
            <Input
              className="min-w-0 flex-1"
              aria-label={`Sửa mô tả task ${task.title}`}
              {...register('description')}
            />
            <Button type="primary" htmlType="submit" disabled={busy}>
              Lưu
            </Button>
            <Button type="text" disabled={busy} onClick={() => setEditing(false)}>
              Huỷ
            </Button>
          </form>
        ) : (
          <>
            <h3 className="m-0 text-body font-semibold [overflow-wrap:anywhere]">{task.title}</h3>
            {task.description && <p className="mt-1 truncate text-label text-ink2">{task.description}</p>}
          </>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 max-md:items-start">
        <p className="m-0 flex gap-2 whitespace-nowrap font-mono text-meta text-ink3 max-md:[overflow-wrap:anywhere] max-md:whitespace-normal">
          {task.assigneeId ? (
            <code className="font-mono" title={task.assigneeId}>
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

        {editing ? null : (
          <div className="flex gap-2">
            <Button
              type="text"
              aria-label={`Sửa task ${task.title}`}
              disabled={busy}
              onClick={startEdit}
            >
              Sửa
            </Button>
            {/* Tier 3: Popconfirm thay Modal confirm (bubble bám trigger) */}
            <Popconfirm
              open={confirming}
              title="Xoá task này?"
              description="Hành động không thể hoàn tác."
              danger
              okText="Xác nhận xoá"
              onConfirm={() => void run(() => onDelete(task))}
              onCancel={() => setConfirming(false)}
            >
              <Button
                type="text"
                danger
                aria-label={`Xoá task ${task.title}`}
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                Xoá
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>
    </li>
  );
}
