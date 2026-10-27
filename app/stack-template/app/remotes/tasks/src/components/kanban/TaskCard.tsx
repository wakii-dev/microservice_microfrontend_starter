// TaskCard — NỘI DUNG card kanban (redesign compose-từ-kit 2026-10-27): render
// qua renderCard của KanbanBoard kit — wrapper Draggable/DropZone (drag native +
// keyboard + drop handling) do kit lo, file này chỉ render phần nhìn: title
// truncate + mô tả + meta line (status dot màu token · assignee Avatar · time
// relative) + actions row (StatusSelect fallback a11y · Sửa · Xoá Popconfirm).
// assignment_failed (status hệ thống — PATCH cấm): StatusBadge thay dot/select,
// không có onStatusChange.
// ⚠ Actions row stopPropagation keydown: chặn event bubbles lên Draggable của
// kit (Space trên select/button phải là hành vi của control đó, không nhặt card).
import { Avatar, Icon, Popconfirm } from '@wakii/ui-kit';
import { useState } from 'react';
import type { Task, TaskStatus } from '../../api';
import { StatusBadge } from '../StatusBadge';
import { StatusSelect } from '../StatusSelect';
import { assigneeInitials } from './utils';

/** Dot màu theo status — token trạng thái (không hex). */
const STATUS_DOT: Record<Task['status'], string> = {
  todo: 'bg-st-todo',
  in_progress: 'bg-st-doing',
  done: 'bg-st-done',
  assignment_failed: 'bg-st-fail',
};

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

const relativeFormat = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' });

/** Thời gian tương đối ngắn (hôm nay · 3 ngày trước) — thô theo ngày đủ cho card compact. */
function relativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) < 1) return 'hôm nay';
  return relativeFormat.format(days, 'day');
}

export interface TaskCardProps {
  task: Task;
  /** PATCH/XOÁ đang bay — khoá select + actions, mờ card (test contract opacity-60). */
  busy?: boolean;
  /** Undefined với card hệ thống (assignment_failed) — không render fallback select. */
  onStatusChange?: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, busy = false, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const system = task.status === 'assignment_failed';
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      data-testid={`kanban-card-${task.id}`}
      className={`group select-none rounded-xl border border-line bg-s2 p-2.5 transition-colors hover:border-accent/40 ${
        busy ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="m-0 min-w-0 flex-1 truncate text-label font-semibold text-ink" title={task.title}>
          {task.title}
        </h3>
        {system && <StatusBadge title={task.title} status={task.status} />}
      </div>
      {task.description && (
        <p className="m-0 mt-0.5 truncate text-meta text-ink3" title={task.description}>
          {task.description}
        </p>
      )}

      {/* meta line — Avatar assignee (initials rút từ id) + dot màu status + relative time */}
      <div className="mt-1.5 flex items-center gap-2 text-meta text-ink3">
        {task.assigneeId ? (
          <span title={task.assigneeId} className="shrink-0">
            <Avatar size={18} alt={task.assigneeId}>
              {assigneeInitials(task.assigneeId) ?? '?'}
            </Avatar>
          </span>
        ) : (
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-pill ${STATUS_DOT[task.status]}`} />
        )}
        <span className="truncate">
          {task.assigneeId ? (
            <code className="font-mono" title={task.assigneeId}>
              {shortId(task.assigneeId)}
            </code>
          ) : (
            'Chưa gán'
          )}
        </span>
        <span aria-hidden="true">·</span>
        <time dateTime={task.createdAt} title={new Date(task.createdAt).toLocaleString('vi-VN')}>
          {relativeTime(task.createdAt)}
        </time>
      </div>

      {/* actions — ẩn tới hover/focus (compact); StatusSelect = fallback a11y.
       * stopPropagation: Space/Enter/Arrow trên control của row là của control —
       * không nhặt card keyboard-drag của kit. */}
      <div
        className="mt-2 flex items-center justify-between gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        onKeyDown={(event) => event.stopPropagation()}
      >
        {!system && onStatusChange ? (
          <StatusSelect task={task} disabled={busy} onChange={(status) => onStatusChange(task, status)} />
        ) : (
          <span />
        )}
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={`Sửa task ${task.title}`}
            disabled={busy}
            className="cursor-pointer rounded-md border-none bg-transparent p-1 text-ink3 transition-colors hover:bg-s3 hover:text-ink"
            onClick={() => onEdit(task)}
          >
            <Icon name="pencil" size={12} />
          </button>
          <Popconfirm
            open={confirming}
            title="Xoá task này?"
            description="Hành động không thể hoàn tác."
            danger
            okText="Xác nhận xoá"
            onConfirm={() => onDelete(task)}
            onCancel={() => setConfirming(false)}
          >
            <button
              type="button"
              aria-label={`Xoá task ${task.title}`}
              disabled={busy}
              className="cursor-pointer rounded-md border-none bg-transparent p-1 text-ink3 transition-colors hover:bg-st-fail/15 hover:text-st-fail"
              onClick={() => setConfirming(true)}
            >
              <Icon name="trash" size={12} />
            </button>
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}
