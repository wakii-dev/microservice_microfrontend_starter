// DragDrop — native HTML5 drag&drop primitives, 0 deps (story VU-53 worker W9).
// Draggable: wrapper draggable=true; đang kéo → opacity-40 + cursor-grabbing
// (+ draggingClass); payload JSON qua dataTransfer (DRAG_MIME). handle prop giới
// hạn vùng kéo — dragstart NGOÀI handle bị cancel (chỉ handle mới kéo thật).
// DropZone: dragover preventDefault + highlight ring accent (state isOver); drop
// parse payload JSON → onDrop(data, event). accept lọc theo dataTransfer.types —
// native DnD chỉ cho ĐỌC types lúc dragover (data bị browser khoá tới drop).
// Keyboard: DragDropProvider đăng ký zones qua context (thứ tự mount ≈ DOM order) —
// Draggable focusable, Space "nhặt" (aria-pressed), Arrows chạy giữa DropZone
// siblings, Enter thả vào zone active, Esc hủy. Consumer onKeyDown chạy TRƯỚC
// default và có thể preventDefault để tự điều khiển (pattern Kanban).
// ⚠️ Hạn chế có chủ đích: native HTML5 DnD KHÔNG hỗ trợ touch (mobile) — muốn hỗ
// trợ thì nâng cấp peer-dep dnd-kit, KHÔNG tự viết pointer engine.
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

/** MIME payload của kit — DropZone mặc định chỉ accept type này. */
export const DRAG_MIME = 'application/x-ui-kit-dnd';

// ── Context — keyboard drag + zone registry (composite layer vd Kanban dùng) ──

interface ZoneRecord {
  id: string;
  /** Đọc ref mới mỗi lần drop — onDrop inline đổi identity mỗi render. */
  onDropRef: RefObject<((data: unknown, event?: DragEvent) => void) | undefined>;
}

export interface DragDropApi {
  /** Keyboard drag đang nhặt: payload + dragId của Draggable nguồn. */
  keyboardDrag: { data: unknown; sourceId: string } | null;
  /** Zone đang là mục tiêu keyboard (focusZone di con trỏ này). */
  activeZoneId: string | null;
  registerZone(zone: ZoneRecord): () => void;
  beginKeyboardDrag(data: unknown, sourceId: string): void;
  /** Enter — thả payload vào zone active (fire onDrop không event), kết thúc. */
  endKeyboardDrag(): void;
  cancelKeyboardDrag(): void;
  /** Arrows — zone kế tiếp/trước trong registry (wrap vòng). */
  focusZone(dir: 1 | -1): void;
}

const DragDropContext = createContext<DragDropApi | null>(null);

/** Context keyboard của primitives — null nếu không bọc DragDropProvider. */
export function useDragDrop(): DragDropApi | null {
  return useContext(DragDropContext);
}

export function DragDropProvider({ children }: { children: ReactNode }) {
  const zonesRef = useRef<ZoneRecord[]>([]);
  const [keyboardDrag, setKeyboardDrag] = useState<{ data: unknown; sourceId: string; zoneIdx: number } | null>(
    null,
  );

  const activeZoneId = keyboardDrag ? (zonesRef.current[keyboardDrag.zoneIdx]?.id ?? null) : null;

  const api: DragDropApi = {
    keyboardDrag,
    activeZoneId,
    registerZone(zone) {
      zonesRef.current.push(zone);
      return () => {
        zonesRef.current = zonesRef.current.filter((z) => z !== zone);
      };
    },
    beginKeyboardDrag(data, sourceId) {
      setKeyboardDrag({ data, sourceId, zoneIdx: 0 });
    },
    endKeyboardDrag() {
      if (!keyboardDrag) return;
      zonesRef.current[keyboardDrag.zoneIdx]?.onDropRef.current?.(keyboardDrag.data);
      setKeyboardDrag(null);
    },
    cancelKeyboardDrag() {
      setKeyboardDrag(null);
    },
    focusZone(dir) {
      setKeyboardDrag((kd) => {
        if (!kd || zonesRef.current.length === 0) return kd;
        const n = zonesRef.current.length;
        return { ...kd, zoneIdx: (kd.zoneIdx + dir + n) % n };
      });
    },
  };

  return <DragDropContext.Provider value={api}>{children}</DragDropContext.Provider>;
}

// ── Draggable ──

export interface DraggableProps {
  /** Payload — JSON hoá vào dataTransfer, DropZone parse lại thành object. */
  data: unknown;
  /** Id ổn định cho keyboard grab (mặc định useId). */
  dragId?: string;
  /** Giới hạn vùng kéo: chỉ dragstart TRONG node này được chấp nhận. */
  handle?: ReactNode;
  disabled?: boolean;
  /** Class thêm khi đang kéo (mouse hoặc keyboard grab) — vd motion composite. */
  draggingClass?: string;
  /** Bắn sau khi dragstart hợp lệ (composite cần biết card nào đang kéo). */
  onDragStart?: () => void;
  /** Bắn ở dragend (kể cả khi drop bị huỷ). */
  onDragEnd?: () => void;
  /** Chạy TRƯỚC keyboard default — preventDefault để tự điều khiển. */
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  /** aria-label cho role=button (không cần nếu content đã có text). */
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function Draggable({
  data,
  dragId,
  handle,
  disabled = false,
  draggingClass,
  onDragStart,
  onDragEnd,
  onKeyDown,
  ariaLabel,
  className,
  children,
}: DraggableProps) {
  const dnd = useDragDrop();
  const autoId = useId();
  const id = dragId ?? autoId;
  const [mouseDragging, setMouseDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const grabbed = dnd?.keyboardDrag?.sourceId === id;
  const dragging = mouseDragging || grabbed;

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    if (disabled) {
      e.preventDefault();
      return;
    }
    // Handle mode: dragstart ngoài handle → cancel (chỉ handle mới kéo thật).
    if (handle && !handleRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer?.setData(DRAG_MIME, JSON.stringify(data));
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
    setMouseDragging(true);
    onDragStart?.();
  }

  function handleDragEnd() {
    setMouseDragging(false);
    onDragEnd?.();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(e);
    if (e.defaultPrevented || !dnd || disabled) return;
    // Spacebar: browser thật = ' ', user-event = 'Space' — nhận cả hai.
    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      if (grabbed) dnd.cancelKeyboardDrag();
      else dnd.beginKeyboardDrag(data, id);
      return;
    }
    if (!grabbed) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      dnd.endKeyboardDrag();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dnd.cancelKeyboardDrag();
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      dnd.focusZone(e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1);
    }
  }

  // State kéo (mouse + keyboard grab) chung 1 bộ visual — data-dragging để test.
  const dragClasses = dragging
    ? `opacity-40 cursor-grabbing${draggingClass ? ` ${draggingClass}` : ''}`
    : disabled
      ? 'cursor-not-allowed'
      : 'cursor-grab';

  return (
    <div
      draggable={!disabled}
      role="button"
      aria-pressed={grabbed}
      aria-label={ariaLabel}
      data-dragging={dragging ? 'true' : undefined}
      data-drag-id={dragId}
      tabIndex={disabled ? undefined : 0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onKeyDown={handleKeyDown}
      className={`focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${dragClasses}${className ? ` ${className}` : ''}`}
    >
      {handle && (
        <div ref={handleRef} data-drag-handle="">
          {handle}
        </div>
      )}
      {children}
    </div>
  );
}

// ── DropZone ──

export interface DropZoneProps {
  /** Nhận (data, event) khi drop parse được payload DRAG_MIME. */
  onDrop?: (data: unknown, event: DragEvent) => void;
  /** dataTransfer.types phải chứa ÍT NHẤT 1 type này — mặc định [DRAG_MIME]. */
  accept?: string[];
  /** Class thay highlight mặc định (ring-accent/40 + bg-accent/10) khi isOver. */
  activeClass?: string;
  disabled?: boolean;
  /** Tên zone (aria-label + role=group) cho ngữ cảnh keyboard/screen-reader. */
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function DropZone({
  onDrop,
  accept = [DRAG_MIME],
  activeClass,
  disabled = false,
  ariaLabel,
  className,
  children,
}: DropZoneProps) {
  const dnd = useDragDrop();
  const id = useId();
  const [isOver, setIsOver] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  });

  // Đăng ký zone cho keyboard (mount order ≈ DOM order — wrap trong provider).
  useEffect(() => {
    if (!dnd) return;
    return dnd.registerZone({ id, onDropRef });
  }, [dnd, id]);

  function accepts(e: DragEvent<HTMLDivElement>) {
    if (disabled) return false;
    return Array.from(e.dataTransfer?.types ?? []).some((t) => accept.includes(t));
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    if (!accepts(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (!accepts(e)) return;
    e.preventDefault(); // BẮT BUỘC để browser cho phép drop
    setIsOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    // Flicker guard: qua lại giữa children không tính là rời zone.
    if (zoneRef.current?.contains(e.relatedTarget as Node)) return;
    setIsOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsOver(false);
    if (disabled) return;
    const raw = e.dataTransfer?.getData(DRAG_MIME) ?? '';
    if (!raw) return;
    try {
      // stopPropagation — zone con xử lý drop, zone cha (vd cột) không nhân đôi.
      e.stopPropagation();
      onDropRef.current?.(JSON.parse(raw) as unknown, e);
    } catch {
      /* payload hỏng/không phải JSON → bỏ qua, không bắn callback */
    }
  }

  const kbActive = dnd?.activeZoneId === id;
  const highlight = activeClass ?? 'ring-2 ring-accent/40 bg-accent/10';

  return (
    <div
      ref={zoneRef}
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      data-dnd-over={isOver ? 'true' : undefined}
      data-dnd-active={kbActive ? 'true' : undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${isOver ? highlight : ''} ${kbActive ? 'ring-2 ring-accent/60' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
