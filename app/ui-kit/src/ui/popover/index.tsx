// Popover — panel overlay nội dung tự do neo trigger (antd-like: title + content,
// khác Tooltip chỉ text / Popconfirm chỉ confirm). Panel rounded-xl + shadow-pop,
// animate zoom-in; trigger hover|click|focus; đóng: ESC + click ngoài (useClickAway).
// Placement top/bottom/left/right + auto-flip: panel sát mép viewport → tự lật
// (useAutoFlipPlacement — đo trước paint, dùng chung Tooltip).
// A11y: trigger aria-haspopup=dialog + aria-expanded (cloneElement); panel
// role=dialog — KHÔNG focus trap (popover phi-modal, focus đi ra ngoài tự do).
// Customize pass (slots wave 3): classNames slots (root/trigger/panel) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useClickAway } from '../../hooks/useClickAway.js';
import { useAutoFlipPlacement, type FlipPlacement } from './auto-flip.js';

export type PopoverPlacement = FlipPlacement;
export type PopoverTriggerAction = 'hover' | 'click' | 'focus';

/** Vị trí panel theo placement (center dọc/ngang đi kèm). */
const PANEL_POSITION: Record<FlipPlacement, string> = {
  top: 'left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)]',
  bottom: 'left-1/2 -translate-x-1/2 top-[calc(100%+10px)]',
  left: 'top-1/2 -translate-y-1/2 right-[calc(100%+10px)]',
  right: 'top-1/2 -translate-y-1/2 left-[calc(100%+10px)]',
};

/** Mũi tên: nửa chìa ra ngoài mép panel quay về trigger, 2 cạnh xoay 45° tạo đỉnh. */
const ARROW_POSITION: Record<FlipPlacement, string> = {
  top: 'left-1/2 -translate-x-1/2 top-[calc(100%-4px)] border-b border-r',
  bottom: 'left-1/2 -translate-x-1/2 bottom-[calc(100%-4px)] border-t border-l',
  left: 'top-1/2 -translate-y-1/2 left-[calc(100%-4px)] border-t border-r',
  right: 'top-1/2 -translate-y-1/2 right-[calc(100%-4px)] border-b border-l',
};

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface PopoverClassNames {
  /** Span gốc — context định vị + nhận click-away/hover/focus handlers. */
  root?: string;
  /** Span bọc trigger element (nơi click-toggle dính). */
  trigger?: string;
  /** Panel role="dialog" (không gồm title/content/arrow). */
  panel?: string;
}

export interface PopoverProps {
  /** Nội dung chính của panel (body) — ReactNode tự do. */
  content: ReactNode;
  /** Tiêu đề panel — có divider mảnh phía dưới (bỏ nếu không truyền). */
  title?: ReactNode;
  /** Trigger element — Popover bọc quanh element này. */
  children: ReactNode;
  /** Vị trí panel so với trigger (mặc định 'top' — nhất quán Tooltip). Sát mép viewport → tự lật. */
  placement?: PopoverPlacement;
  /** Hành vi mở panel (mặc định 'hover'). */
  trigger?: PopoverTriggerAction;
  /** Controlled open — truyền thì component theo state này (bỏ = uncontrolled nội bộ). */
  open?: boolean;
  /** Callback open đổi (mở/đóng bởi hover/click/focus/ESC/click ngoài). */
  onOpenChange?: (open: boolean) => void;
  /** Class bổ sung dán lên panel (vd chỉnh width). */
  className?: string;
  /** Inline style — passthrough lên span gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: PopoverClassNames;
}

export function Popover(props: PopoverProps) {
  const {
    content,
    title,
    children,
    placement = 'top',
    trigger = 'hover',
    open,
    onOpenChange,
    className,
    style,
  } = props;
  const isControlled = open !== undefined;
  // A11y: panel name qua labelledby khi có title (đủ cả title ReactNode).
  const panelTitleId = useId();
  const [innerOpen, setInnerOpen] = useState(false);
  const openState = isControlled ? open : innerOpen;
  // Auto-flip: đo panel sau khi mở, lật placement nếu sát mép viewport
  const panelRef = useRef<HTMLDivElement>(null);
  const shownPlacement = useAutoFlipPlacement(openState, placement, panelRef);

  // Bridge controlled/uncontrolled — controlled thì chỉ báo về consumer tự đóng.
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Click ngoài (mousedown/touchstart ra khỏi root) → đóng.
  const rootRef = useClickAway<HTMLSpanElement>(() => {
    if (openState) setOpen(false);
  });

  // ESC đóng (document-level — bắt cả khi focus đã chui vào panel).
  useEffect(() => {
    if (!openState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openState, setOpen]);

  // hover/focus gắn trên ROOT (đưa con trỏ/focus vào panel không đóng — panel là
  // DOM con của root); blur chỉ đóng khi focus CHẲNG tới đâu ngoài root.
  const rootHandlers =
    trigger === 'focus'
      ? {
          onFocus: () => setOpen(true),
          onBlur: (e: ReactFocusEvent<HTMLSpanElement>) => {
            if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
          },
        }
      : trigger === 'hover'
        ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
        : {};
  // Click gắn riêng lên span bọc TRIGGER — click bên trong panel bubble lên root
  // không được toggle đóng (vd nút action trong rich content).

  // Wire aria lên trigger element (SR biết panel dialog đang mở).
  const triggerEl = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'dialog',
        'aria-expanded': openState,
      })
    : children;

  const onTriggerClick = () => setOpen(!openState);

  return (
    <span
      ref={rootRef}
      className={classNames('relative inline-flex', props.classNames?.root)}
      style={style}
      {...rootHandlers}
    >
      <span
        onClick={trigger === 'click' ? onTriggerClick : undefined}
        className={classNames('inline-flex', props.classNames?.trigger)}
      >
        {triggerEl}
      </span>
      {openState && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={title ? panelTitleId : undefined}
          className={classNames(
            'absolute z-[var(--z-popover)] w-max max-w-xs rounded-xl border border-line bg-s2 p-3 shadow-[var(--shadow-pop)] animate-[bp-bounce-in_var(--motion-base)_var(--ease-enter)]',
            PANEL_POSITION[shownPlacement],
            props.classNames?.panel,
            className,
          )}
        >
          {title != null && (
            <div id={panelTitleId} className="mb-2 border-b border-line2 pb-2 text-body font-medium text-ink">{title}</div>
          )}
          <div className="text-body text-ink2">{content}</div>
          <span
            aria-hidden="true"
            className={`absolute size-2 rotate-45 border-line bg-s2 ${ARROW_POSITION[shownPlacement]}`}
          />
        </div>
      )}
    </span>
  );
}
