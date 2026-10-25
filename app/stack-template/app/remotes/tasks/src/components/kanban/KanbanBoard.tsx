// KanbanBoard — 3 cột writable (todo/doing/done) + slim column "Gán thất bại"
// (chỉ hiện khi có task hệ thống — PATCH cấm nên không drag/select). Board giữ
// refs các cột (hit-test pickColumn) + drop-target state highlight.
import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Task, TaskStatus } from '../../api';
import { BOARD_COLUMNS, groupByColumn, sortTasks, type BoardSort } from './utils';
import { KanbanCard } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanBoardProps {
  tasks: readonly Task[];
  sort: BoardSort;
  /** id task đang PATCH/XOÁ — mờ + khoá card tương ứng. */
  busyId: string | null;
  /** id task đang kéo (drag) — cột trúng highlight. */
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function KanbanBoard({ tasks, sort, busyId, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  const grouped = groupByColumn(tasks); // 3 cột writable (failed loại khỏi nhóm)
  const failed = sortTasks(tasks.filter((t) => t.status === 'assignment_failed'), sort); // slim column đọc thẳng từ tasks
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const columnEls = useRef<Partial<Record<TaskStatus, HTMLElement | null>>>({});

  const columnRects = () =>
    Object.fromEntries(Object.entries(columnEls.current).map(([status, el]) => [status, el?.getBoundingClientRect() ?? null]));

  function handleDrop(task: Task, target: TaskStatus | null): void {
    setDropTarget(null);
    // task assignment_failed KHÔNG drag (draggable=false → onDragEnd không bắn);
    // guard chéo nữa cho chắc: status hệ thống không bao giờ PATCH.
    if (!target || target === task.status || task.status === 'assignment_failed') return;
    onStatusChange(task, target);
  }

  const failedCards = failed.map((task) => (
    <KanbanCard
      key={task.id}
      task={task}
      draggable={false}
      columnRects={columnRects}
      onHoverColumn={setDropTarget}
      onDrop={handleDrop}
      onStatusChange={onStatusChange}
      onEdit={onEdit}
      onDelete={onDelete}
      busy={busyId === task.id}
    />
  ));

  function renderCards(status: TaskStatus) {
    return sortTasks(grouped[status]!.filter((t) => t.status !== 'assignment_failed'), sort).map((task) => (
      <KanbanCard
        key={task.id}
        task={task}
        draggable
        columnRects={columnRects}
        onHoverColumn={setDropTarget}
        onDrop={handleDrop}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        busy={busyId === task.id}
      />
    ));
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {BOARD_COLUMNS.map(({ status, label }) => {
        const columnTasks = renderCards(status);
        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <KanbanColumn
              label={label}
              count={columnTasks.length}
              isDropTarget={dropTarget === status}
              bodyRef={(el) => {
                columnEls.current[status] = el;
              }}
            >
              {columnTasks}
            </KanbanColumn>
          </motion.div>
        );
      })}

      {/* Slim column Gán thất bại — chỉ hiện khi có task hệ thống (badge failed,
       * không drag/select: PATCH cấm). Tách khỏi 3 cột writable cho count đúng. */}
      {failed.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <KanbanColumn label="Gán thất bại" count={failed.length}>
            {failedCards}
          </KanbanColumn>
        </motion.div>
      )}
    </div>
  );
}
