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
// Touch (R10, 2026-10-18): native HTML5 DnD không có trên touch → pointer fallback
// CHỈ khi pointerType=touch (mouse đi nguyên path HTML5, không đổi): pointerdown →
// ghost clone theo pointer (transform GPU) + elementFromPoint hit-test zone qua
// marker [data-drop-zone] → pointerup dispatch CustomEvent dnd-pointer-drop, DropZone
// tự lắng nghe và bắn onDrop(data) (event undefined như keyboard path).
import classNames from 'classnames';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';

/** MIME payload của kit — DropZone mặc định chỉ accept type này. */
export const DRAG_MIME = 'application/x-ui-kit-dnd';

// ── Pointer fallback (touch) — engine module-level, 1 drag tại 1 thời điểm ──

/** CustomEvent DropZone lắng nghe để nhận payload từ pointer path. */
const POINTER_DROP_EVENT = 'dnd-pointer-drop';
const TOUCH_OVER_ATTR = 'data-dnd-touch-over';

interface PointerDragHooks {
  /** Gọi ở MỌI kết thúc (drop/ huỷ/ unmount) — composite tắt state dragging. */
  onEnd(): void;
}

let activePointerDrag: { cleanup(): void } | null = null;

/** Huỷ drag đang chạy (unmount Draggable giữa chừng) — idempotent. */
function cancelActivePointerDrag(): void {
  activePointerDrag?.cleanup();
}

function zoneOf(el: Element | null): HTMLElement | null {
  return el?.closest<HTMLElement>('[data-drop-zone]') ?? null;
}

/** elementFromPoint bọc an toàn — jsdom không implement, trả null (no hit-test). */
function hitTest(x: number, y: number): Element | null {
  return typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : null;
}

function startPointerDrag(
  source: HTMLElement,
  data: unknown,
  start: PointerEvent,
  hooks: PointerDragHooks,
): void {
  cancelActivePointerDrag(); // an toàn: 1 drag tại 1 thời điểm
  const rect = source.getBoundingClientRect();
  // Ghost = clone nguồn, fixed tại chỗ, theo pointer bằng transform (GPU — motion
  // identity chỉ animate transform), pointer-events-none để elementFromPoint
  // "xuyên qua" ghost trúng zone thật bên dưới.
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.setAttribute('data-dnd-ghost', '');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.position = 'fixed';
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.margin = '0';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = 'var(--z-tooltip)';
  ghost.style.opacity = '0.9';
  document.body.appendChild(ghost);
  source.style.touchAction = 'none'; // chặn scroll cướp gesture khi đang kéo

  let lastZone: HTMLElement | null = null;
  const clearOver = () => {
    lastZone?.removeAttribute(TOUCH_OVER_ATTR);
    lastZone = null;
  };

  const onMove = (ev: PointerEvent) => {
    ghost.style.transform = `translate3d(${ev.clientX - start.clientX}px, ${ev.clientY - start.clientY}px, 0)`;
    const zone = zoneOf(hitTest(ev.clientX, ev.clientY));
    if (zone !== lastZone) {
      clearOver();
      if (zone) {
        zone.setAttribute(TOUCH_OVER_ATTR, '');
        lastZone = zone;
      }
    }
  };

  const finish = (ev: PointerEvent | null, drop: boolean) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    clearOver();
    ghost.remove();
    source.style.touchAction = '';
    activePointerDrag = null;
    hooks.onEnd();
    if (drop && ev) {
      // Hit-test LẠI lúc thả (sau khi ghost đã remove — không che target), dispatch
      // trên zone element; DropZone tự lắng nghe và bắn onDropRef(data).
      zoneOf(hitTest(ev.clientX, ev.clientY))?.dispatchEvent(
        new CustomEvent(POINTER_DROP_EVENT, { detail: { data } }),
      );
    }
  };
  const onUp = (ev: PointerEvent) => finish(ev, true);
  const onCancel = () => finish(null, false);

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  activePointerDrag = { cleanup: () => finish(null, false) };
}

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
// eslint-disable-next-line react-refresh/only-export-components
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

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface DraggableClassNames {
  /** Div wrapper draggable (role=button). */
  root?: string;
  /** Div bọc handle (chỉ render khi có handle prop). */
  handle?: string;
}

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
  /** Inline style — passthrough lên wrapper. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: DraggableClassNames;
  children?: ReactNode;
}

export function Draggable(props: DraggableProps) {
  const {
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
    style,
    children,
  } = props;
  const slots = props.classNames;
  const dnd = useDragDrop();
  const autoId = useId();
  const id = dragId ?? autoId;
  const [mouseDragging, setMouseDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  // Touch path: unmount giữa chừng → huỷ engine (gỡ listener + ghost).
  useEffect(() => () => cancelActivePointerDrag(), []);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // CHỈ touch — mouse đi path HTML5 draggable (không đổi behavior hiện tại).
    if (e.pointerType !== 'touch' || disabled || activePointerDrag) return;
    // Handle mode áp cho touch: pointerdown ngoài handle → không kéo.
    if (handle && !handleRef.current?.contains(e.target as Node)) return;
    e.preventDefault(); // chặn scroll/long-press cướp gesture
    setMouseDragging(true);
    onDragStart?.();
    startPointerDrag(e.currentTarget, data, e.nativeEvent, {
      onEnd: () => {
        setMouseDragging(false);
        onDragEnd?.();
      },
    });
  }

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
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={classNames(
        'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none',
        dragClasses,
        slots?.root,
        className,
      )}
      style={style}
    >
      {handle && (
        <div ref={handleRef} data-drag-handle="" className={slots?.handle}>
          {handle}
        </div>
      )}
      {children}
    </div>
  );
}

// ── DropZone ──

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface DropZoneClassNames {
  /** Div zone nhận drop (marker data-drop-zone). */
  root?: string;
}

export interface DropZoneProps {
  /** Nhận (data, event) khi drop parse được payload DRAG_MIME — event undefined
   * khi thả bằng keyboard (endKeyboardDrag không có DragEvent thật). */
  onDrop?: (data: unknown, event?: DragEvent) => void;
  /** dataTransfer.types phải chứa ÍT NHẤT 1 type này — mặc định [DRAG_MIME]. */
  accept?: string[];
  /** Class thay highlight mặc định (ring-accent/40 + bg-accent/10) khi isOver. */
  activeClass?: string;
  disabled?: boolean;
  /** Tên zone (aria-label + role=group) cho ngữ cảnh keyboard/screen-reader. */
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên div zone. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: DropZoneClassNames;
  children?: ReactNode;
}

export function DropZone(props: DropZoneProps) {
  const {
    onDrop,
    accept = [DRAG_MIME],
    activeClass,
    disabled = false,
    ariaLabel,
    className,
    style,
    children,
  } = props;
  const slots = props.classNames;
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

  // Touch path: engine dispatch CustomEvent trên zone element (hit-test qua marker
  // data-drop-zone) — không cần context, standalone Draggable/DropZone vẫn hoạt động.
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const onPointerDrop = (ev: Event) => {
      if (disabled) return;
      const data = (ev as CustomEvent<{ data: unknown }>).detail?.data;
      // event undefined như keyboard path — pointer không có DragEvent thật.
      onDropRef.current?.(data);
    };
    el.addEventListener(POINTER_DROP_EVENT, onPointerDrop);
    return () => el.removeEventListener(POINTER_DROP_EVENT, onPointerDrop);
  }, [disabled]);

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
      data-drop-zone=""
      data-dnd-over={isOver ? 'true' : undefined}
      data-dnd-active={kbActive ? 'true' : undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={classNames(
        isOver ? highlight : '',
        kbActive ? 'ring-2 ring-accent/60' : '',
        'data-[dnd-touch-over]:ring-2 data-[dnd-touch-over]:ring-accent/40 data-[dnd-touch-over]:bg-accent/10',
        slots?.root,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
