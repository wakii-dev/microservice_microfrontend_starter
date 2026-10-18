// Kanban — composite board trên primitives DragDrop (native HTML5 DnD), 0 deps
// (story VU-53 worker W9). CONTROLLED: consumer sở hữu state — board chỉ bắn
// onCardMove(cardKey, fromColKey, toColKey, toIndex), với toIndex = vị trí CUỐI
// trong cột đích SAU khi card rời cột nguồn (consumer: remove rồi splice).
// Cột: header (title + Badge count + slot meta) · EmptyState "Kéo thẻ vào đây"
// khi rỗng · drop-indicator đường accent nơi sẽ chèn (slot hover = inset line,
// keyboard cursor = line element). WIP-limit: cột đầy từ chối drop TỪ CỘT KHÁC
// (đổi thứ tự trong cùng cột vẫn hợp lệ) + border-st-fail + aria-live.
// Card: bg-s1 rounded-xl, hover shadow-lift, grab cursor, focus ring chuẩn;
// tag → Tag · left slot → Avatar. Motion: đang kéo scale-[1.02] + shadow-lift;
// card vừa move replay bp-fade-in fast (mượt nhưng khiêm tốn).
// Keyboard: Tab tới card → Space nhặt → ↑↓ đổi vị trí, ←→ đổi cột → Enter thả →
// Esc hủy; aria-live thông báo "Đã chuyển X tới cột Y, vị trí Z".
// ⚠️ Hạn chế có chủ đích: native HTML5 DnD KHÔNG hỗ trợ touch (mobile) — muốn
// hỗ trợ thì nâng cấp peer-dep dnd-kit (pointer engine hoàn chỉnh), KHÔNG tự viết.
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { DragDropProvider, Draggable, DropZone, useDragDrop } from '../drag-drop/index.js';
import { Badge } from '../badge/index.js';
import { EmptyState } from '../empty-state/index.js';
import { Tag } from '../tag/index.js';

export interface KanbanCardData {
  key: string;
  title: string;
  description?: string;
  /** Nhãn nhỏ dưới title — render bằng Tag. */
  tag?: string;
  /** Slot trái của card (thường Avatar assignee). */
  left?: ReactNode;
}

export interface KanbanColumnData {
  key: string;
  title: string;
  /** Slot phải của header (action — vd menu thêm thẻ). */
  meta?: ReactNode;
  /** Giới hạn WIP — cột đầy từ chối drop từ cột khác + border-st-fail. */
  wipLimit?: number;
  cards: KanbanCardData[];
}

export interface KanbanBoardProps {
  columns: KanbanColumnData[];
  /** toIndex = vị trí CUỐI trong cột đích SAU khi card rời nguồn (remove → splice). */
  onCardMove?: (cardKey: string, fromColKey: string, toColKey: string, toIndex: number) => void;
  /** Custom card content — Draggable + drop handling vẫn bọc bên ngoài node này. */
  renderCard?: (card: KanbanCardData, columnKey: string) => ReactNode;
  ariaLabel?: string;
  className?: string;
}

/** Kế hoạch move — toIndex đã trừ shift khi card rời chính cột đó. */
interface MovePlan {
  fromColKey: string;
  fromIdx: number;
  toColKey: string;
  toIndex: number;
}

/**
 * insertIdx là vị trí "chèn trước" trong mảng HIỆN TẠI của cột đích (trước khi
 * card rời nguồn). Cùng cột: vị trí sau remove = insertIdx - 1 nếu chèn sau
 * vị trí cũ; trùng vị trí cũ → null (no-op).
 */
function computeMove(columns: KanbanColumnData[], cardKey: string, toColKey: string, insertIdx: number): MovePlan | null {
  for (const col of columns) {
    const i = col.cards.findIndex((c) => c.key === cardKey);
    if (i < 0) continue;
    const same = col.key === toColKey;
    const toIndex = same && insertIdx > i ? insertIdx - 1 : insertIdx;
    if (same && toIndex === i) return null;
    return { fromColKey: col.key, fromIdx: i, toColKey, toIndex };
  }
  return null;
}

/** Đường accent nơi thẻ sẽ chèn (keyboard cursor). */
function DropLine() {
  return <div aria-hidden="true" className="h-0.5 shrink-0 rounded-pill bg-accent" />;
}

function KanbanCardView({ card, flash }: { card: KanbanCardData; flash: boolean }) {
  return (
    <div
      className={`rounded-xl border border-line bg-s1 p-3 transition-[transform,box-shadow] duration-200 ease-[var(--ease-enter)] hover:shadow-lift${
        flash ? ' animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {card.left && <div className="shrink-0">{card.left}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-body font-medium text-ink">{card.title}</div>
          {card.description && <p className="mt-0.5 text-meta text-ink2">{card.description}</p>}
        </div>
      </div>
      {card.tag && (
        <div className="mt-2">
          <Tag>{card.tag}</Tag>
        </div>
      )}
    </div>
  );
}

interface DragState {
  cardKey: string;
  fromColKey: string;
}

function BoardInner({ columns, onCardMove, renderCard, ariaLabel, className }: KanbanBoardProps) {
  const dnd = useDragDrop();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [cursor, setCursor] = useState<{ colKey: string; index: number } | null>(null);
  const [live, setLive] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  /** Vị trí chèn hợp lệ của cột colKey: 0..length (chèn-trước-each + cuối cột) —
   * như nhau cho cả cột nguồn (computeMove tự khử vị trí no-op của chính card). */
  function clampIndex(colKey: string, index: number) {
    const max = columns.find((c) => c.key === colKey)?.cards.length ?? 0;
    return Math.min(Math.max(0, index), max);
  }

  function applyMove(move: MovePlan | null, cardKey: string) {
    if (!move) return;
    const to = columns.find((c) => c.key === move.toColKey);
    const card = columns.flatMap((c) => c.cards).find((c) => c.key === cardKey);
    if (!to || !card) return;
    // WIP chỉ chặn transfer GIỮA CỘT — reorder trong cột đầy vẫn hợp lệ (count không đổi).
    if (move.fromColKey !== move.toColKey && to.wipLimit !== undefined && to.cards.length >= to.wipLimit) {
      setLive(`Cột "${to.title}" đã đạt giới hạn WIP (${to.cards.length}/${to.wipLimit}) — từ chối thẻ "${card.title}".`);
      return;
    }
    onCardMove?.(cardKey, move.fromColKey, move.toColKey, move.toIndex);
    setLive(`Đã chuyển "${card.title}" tới cột "${to.title}", vị trí ${move.toIndex + 1}.`);
    setFlash(cardKey);
    setDrag(null);
    setCursor(null);
  }

  /** Drop (mouse) — payload từ dataTransfer là card đang kéo; slot = chèn trước, cột = append. */
  function handleDrop(toColKey: string, insertIdx: number, payload: unknown) {
    const cardKey = (payload as { cardKey?: string } | null)?.cardKey;
    if (!cardKey || cardKey !== drag?.cardKey) return;
    applyMove(computeMove(columns, cardKey, toColKey, insertIdx), cardKey);
  }

  function endKeyboardDrag() {
    dnd?.cancelKeyboardDrag();
    setDrag(null);
    setCursor(null);
  }

  /** Keyboard: Space nhặt → ↑↓ vị trí, ←→ cột → Enter thả → Esc hủy. */
  function onCardKeyDown(e: KeyboardEvent<HTMLDivElement>, cardKey: string) {
    if (!dnd) return;
    const grabbed = dnd.keyboardDrag?.sourceId === cardKey;
    if (!grabbed) {
      // Spacebar: browser thật = ' ', user-event = 'Space' — nhận cả hai.
      if (e.key !== ' ' && e.key !== 'Space') return;
      e.preventDefault();
      const fromCol = columns.find((c) => c.cards.some((c2) => c2.key === cardKey));
      if (!fromCol) return;
      dnd.beginKeyboardDrag({ cardKey }, cardKey);
      setDrag({ cardKey, fromColKey: fromCol.key });
      setFlash(null); // move kế tiếp replay fade-in
      setCursor({ colKey: fromCol.key, index: clampIndex(fromCol.key, fromCol.cards.findIndex((c) => c.key === cardKey)) });
      return;
    }
    if (e.key === ' ') {
      e.preventDefault(); // đã nhặt — Space không có tác dụng phụ
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c ? { ...c, index: clampIndex(c.colKey, c.index + (e.key === 'ArrowDown' ? 1 : -1)) } : c));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setCursor((c) => {
        if (!c) return c;
        const ci = columns.findIndex((col) => col.key === c.colKey);
        const ni = Math.min(Math.max(0, ci + (e.key === 'ArrowRight' ? 1 : -1)), columns.length - 1);
        if (ni === ci) return c;
        const colKey = columns[ni].key;
        return { colKey, index: clampIndex(colKey, c.index) };
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (cursor) applyMove(computeMove(columns, cardKey, cursor.colKey, cursor.index), cardKey);
      endKeyboardDrag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      endKeyboardDrag();
    }
  }

  return (
    <div className={`flex items-start gap-4 overflow-x-auto pb-2${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      <div aria-live="polite" className="sr-only">
        {live}
      </div>
      {columns.map((col) => {
        const full = col.wipLimit !== undefined && col.cards.length >= col.wipLimit;
        return (
          <section
            key={col.key}
            aria-label={col.title}
            className={`flex w-72 shrink-0 flex-col gap-2 rounded-xl border bg-s2 p-3${full ? ' border-st-fail/50' : ' border-line'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-label font-semibold text-ink">{col.title}</span>
                <Badge variant={full ? 'failed' : 'todo'}>
                  {col.wipLimit !== undefined ? `${col.cards.length}/${col.wipLimit}` : col.cards.length}
                </Badge>
              </div>
              {col.meta}
            </div>
            <DropZone
              ariaLabel={col.title}
              activeClass={full ? 'bg-st-fail/5' : 'bg-accent/5'}
              onDrop={(data) => handleDrop(col.key, col.cards.length, data)}
              className="flex min-h-20 flex-col gap-2 rounded-lg"
            >
              {col.cards.length === 0 ? (
                <EmptyState title="Kéo thẻ vào đây" />
              ) : (
                col.cards.map((card, i) => (
                  <div key={card.key} className="contents">
                    {cursor?.colKey === col.key && cursor.index === i && <DropLine />}
                    <DropZone
                      // Vùng "chèn trước card này" — highlight = đường accent trên
                      // cạnh trên (inset shadow: KHÔNG shift layout như border-t).
                      activeClass="shadow-[inset_0_2px_0_0_var(--accent)]"
                      onDrop={(data) => handleDrop(col.key, i, data)}
                      className="rounded-xl"
                    >
                      <Draggable
                        dragId={card.key}
                        data={{ cardKey: card.key }}
                        ariaLabel={card.title}
                        draggingClass="scale-[1.02] shadow-lift"
                        onDragStart={() => {
                          setDrag({ cardKey: card.key, fromColKey: col.key });
                          setFlash(null); // move kế tiếp replay fade-in
                        }}
                        onDragEnd={() => setDrag(null)}
                        onKeyDown={(e) => onCardKeyDown(e, card.key)}
                        className="rounded-xl"
                      >
                        {renderCard ? renderCard(card, col.key) : <KanbanCardView card={card} flash={flash === card.key} />}
                      </Draggable>
                    </DropZone>
                  </div>
                ))
              )}
              {cursor?.colKey === col.key && cursor.index >= col.cards.length && <DropLine />}
            </DropZone>
          </section>
        );
      })}
    </div>
  );
}

export function KanbanBoard(props: KanbanBoardProps) {
  // Provider bọc TRƯỚC BoardInner — useDragDrop() bên trong nhận context này.
  return (
    <DragDropProvider>
      <BoardInner {...props} />
    </DragDropProvider>
  );
}
