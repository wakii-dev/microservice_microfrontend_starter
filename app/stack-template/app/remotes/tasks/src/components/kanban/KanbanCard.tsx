// KanbanCard — card compact pro (~56-64px): title 1 dòng truncate + meta line
// (assignee rút gọn + createdAt relative + status dot màu token). Toàn card
// drag (framer-motion) → onDragEnd hit-test cột (pickColumn) → đổi status qua
// mutation của page; dragSnapToOrigin + layout = snap/reorder mượt. Hover/
// focus → actions: StatusSelect (FALLBACK accessibility đổi status bàn phím —
// contract aria "Trạng thái task <title>") · Sửa mở modal · Xoá Popconfirm.
// assignment_failed: badge failed + KHÔNG drag/select (PATCH cấm status hệ thống).
import { Popconfirm } from '@wakii/ui-kit';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Task, TaskStatus } from '../../api';
import { Icon } from '@wakii/ui-kit';
import { StatusBadge } from '../StatusBadge';
import { StatusSelect } from '../StatusSelect';
import { pickColumn } from './utils';

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

export interface KanbanCardProps {
  task: Task;
  /** false → khoá drag (assignment_failed — PATCH cấm status hệ thống). */
  draggable: boolean;
  /** Refs cột (getBoundingClientRect) — hit-test điểm thả. */
  columnRects: () => Record<string, DOMRect | null | undefined>;
  /** Đang kéo qua cột `status` (null = rời) — parent highlight ring. */
  onHoverColumn: (status: TaskStatus | null) => void;
  /** Thả vào cột `status` (null = ngoài) — parent quyết định mutation. */
  onDrop: (task: Task, status: TaskStatus | null) => void;
  /** Đổi status qua fallback dropdown — mutation của page. */
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** PATCH/XOÁ đang bay — khoá select + actions, mờ card. */
  busy?: boolean;
}

export function KanbanCard({
  task,
  draggable,
  columnRects,
  onHoverColumn,
  onDrop,
  onStatusChange,
  onEdit,
  onDelete,
  busy = false,
}: KanbanCardProps) {
  const [confirming, setConfirming] = useState(false);

  function handleDragEnd(_: unknown, info: { point: { x: number; y: number } }) {
    onHoverColumn(null);
    onDrop(task, pickColumn(info.point, columnRects()));
  }

  return (
    <motion.div
      layout
      drag={draggable}
      dragSnapToOrigin
      whileDrag={{ scale: 1.03, boxShadow: 'var(--shadow-pop)', cursor: 'grabbing', zIndex: 30 }}
      onDragStart={() => onHoverColumn(task.status as TaskStatus)} // assignment_failed không drag (draggable=false) — cast an toàn
      onDrag={(_, info) => onHoverColumn(pickColumn(info.point, columnRects()))}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`group relative select-none rounded-lg border border-line bg-s2 p-2.5 transition-colors hover:border-accent/40 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${busy ? 'opacity-60' : ''}`}
      data-testid={`kanban-card-${task.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="m-0 min-w-0 flex-1 truncate text-label font-semibold text-ink" title={task.title}>
          {task.title}
        </h3>
        {task.status === 'assignment_failed' && <StatusBadge title={task.title} status={task.status} />}
      </div>
      {task.description && (
        <p className="m-0 mt-0.5 truncate text-meta text-ink3" title={task.description}>
          {task.description}
        </p>
      )}

      {/* meta line — dot màu status + assignee + relative time */}
      <div className="mt-1.5 flex items-center gap-2 text-meta text-ink3">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-pill ${STATUS_DOT[task.status]}`} />
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

      {/* actions — ẩn tới hover/focus (compact); StatusSelect = fallback a11y */}
      <div className="mt-2 flex items-center justify-between gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {task.status !== 'assignment_failed' ? (
          <StatusSelect
            task={task}
            disabled={busy}
            onChange={(status) => onStatusChange(task, status)}
          />
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
    </motion.div>
  );
}
