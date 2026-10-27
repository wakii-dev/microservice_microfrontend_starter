// KanbanBoard — compose từ **KanbanBoard của @wakii/ui-kit** (redesign 2026-10-27,
// thay board tự vẽ framer-motion): kit lo drag native HTML5 + keyboard DnD
// (Space nhặt → ↑↓ vị trí, ←→ cột → Enter thả — aria-live kèm), EmptyState cột
// rỗng, Badge count, drop indicator. Page sở hữu state — board controlled qua
// props.columns; onCardMove bắn (cardKey, from, to, toIndex).
// 3 cột writable todo/doing/done theo sort; card = TaskCard qua renderCard.
// Slim column "Gán thất bại" (status hệ thống — PATCH cấm) render NGOÀI kit
// board: kit bọc MỌI card trong Draggable trong khi card hệ thống phải đứng im
// (giữ nguyên hành vi "không drag" của bản cũ). Cùng hàng flex với board.
import { Badge, KanbanBoard as KitKanbanBoard, type KanbanColumnData } from '@wakii/ui-kit';
import { useMemo } from 'react';
import type { Task, TaskStatus } from '../../api';
import { BOARD_COLUMNS, groupByColumn, sortTasks, type BoardSort } from './utils';
import { TaskCard } from './TaskCard';

export interface KanbanBoardProps {
  tasks: readonly Task[];
  sort: BoardSort;
  /** id task đang PATCH/XOÁ — mờ + khoá card tương ứng. */
  busyId: string | null;
  /** Đổi status (từ drag kit board hoặc fallback select). */
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function KanbanBoard({ tasks, sort, busyId, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  const grouped = groupByColumn(tasks); // 3 cột writable (failed loại khỏi nhóm)
  const failed = sortTasks(tasks.filter((t) => t.status === 'assignment_failed'), sort);

  /** Kit board gọi cho cả reorder cùng cột — thứ tự trong cột do `sort` điều
   * khiển (controlled → snap về thứ tự sort), chỉ đổi cột mới mutate status.
   * Guard chéo: card hệ thống không bao giờ PATCH. */
  function handleCardMove(cardKey: string, fromColKey: string, toColKey: string) {
    if (fromColKey === toColKey) return;
    const task = tasks.find((t) => t.id === cardKey);
    if (!task || task.status === 'assignment_failed') return;
    onStatusChange(task, toColKey as TaskStatus);
  }

  const columns = useMemo<KanbanColumnData[]>(
    () =>
      BOARD_COLUMNS.map(({ status, label }) => ({
        key: status,
        title: label,
        cards: sortTasks(grouped[status], sort).map((task) => ({
          key: task.id,
          title: task.title,
        })),
      })),
    [grouped, sort],
  );

  function renderCard(cardKey: string) {
    const task = tasks.find((t) => t.id === cardKey);
    if (!task) return null;
    return (
      <TaskCard
        task={task}
        busy={busyId === task.id}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      {/* Kit board — 3 cột writable. aria-label cột = nhãn ("Cần làm"…), section
       * implicit region. shrink-0: board là flex child của wrapper — cuộn ở
       * wrapper, không scroll lồng trong kit board. */}
      <KitKanbanBoard
        columns={columns}
        onCardMove={handleCardMove}
        ariaLabel="Bảng tasks"
        className="shrink-0"
        renderCard={(card) => renderCard(card.key)}
      />

      {/* Slim column Gán thất bại — chỉ hiện khi có task hệ thống (badge failed,
       * không drag/select: PATCH cấm). Tách khỏi 3 cột writable cho count đúng. */}
      {failed.length > 0 && (
        <section
          aria-label="Gán thất bại"
          className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-st-fail/50 bg-s2 p-3"
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="m-0 text-label font-semibold text-ink">Gán thất bại</h3>
            <Badge variant="failed">{failed.length}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {failed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyId === task.id}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
