// Popover — panel overlay nội dung tự do neo trigger (antd-like: title + content,
// khác Tooltip chỉ text / Popconfirm chỉ confirm). Panel rounded-xl + shadow-pop,
// animate zoom-in; trigger hover|click|focus; đóng: ESC + click ngoài (useClickAway).
// A11y: trigger aria-haspopup=dialog + aria-expanded (cloneElement); panel
// role=dialog — KHÔNG focus trap (popover phi-modal, focus đi ra ngoài tự do).
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useState,
  type FocusEvent as ReactFocusEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useClickAway } from '../../hooks/useClickAway.js';

export type PopoverPlacement = 'top' | 'bottom';
export type PopoverTriggerAction = 'hover' | 'click' | 'focus';

export interface PopoverProps {
  /** Nội dung chính của panel (body) — ReactNode tự do. */
  content: ReactNode;
  /** Tiêu đề panel — có divider mảnh phía dưới (bỏ nếu không truyền). */
  title?: ReactNode;
  /** Trigger element — Popover bọc quanh element này. */
  children: ReactNode;
  /** Vị trí panel so với trigger (mặc định 'top' — nhất quán Tooltip). */
  placement?: PopoverPlacement;
  /** Hành vi mở panel (mặc định 'hover'). */
  trigger?: PopoverTriggerAction;
  /** Controlled open — truyền thì component theo state này (bỏ = uncontrolled nội bộ). */
  open?: boolean;
  /** Callback open đổi (mở/đóng bởi hover/click/focus/ESC/click ngoài). */
  onOpenChange?: (open: boolean) => void;
  /** Class bổ sung dán lên panel (vd chỉnh width). */
  className?: string;
}

export function Popover({
  content,
  title,
  children,
  placement = 'top',
  trigger = 'hover',
  open,
  onOpenChange,
  className,
}: PopoverProps) {
  const isControlled = open !== undefined;
  // A11y: panel name qua labelledby khi có title (đủ cả title ReactNode).
  const panelTitleId = useId();
  const [innerOpen, setInnerOpen] = useState(false);
  const openState = isControlled ? open : innerOpen;

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
    <span ref={rootRef} className="relative inline-flex" {...rootHandlers}>
      <span onClick={trigger === 'click' ? onTriggerClick : undefined} className="inline-flex">
        {triggerEl}
      </span>
      {openState && (
        <div
          role="dialog"
          aria-labelledby={title ? panelTitleId : undefined}
          className={`absolute left-1/2 z-[var(--z-popover)] w-max max-w-xs -translate-x-1/2 rounded-xl border border-line bg-s2 p-3 shadow-[var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)] ${
            placement === 'top' ? 'bottom-[calc(100%+10px)]' : 'top-[calc(100%+10px)]'
          }${className ? ` ${className}` : ''}`}
        >
          {title != null && (
            <div id={panelTitleId} className="mb-2 border-b border-line2 pb-2 text-body font-medium text-ink">{title}</div>
          )}
          <div className="text-body text-ink2">{content}</div>
          <span
            aria-hidden="true"
            className={`absolute left-1/2 size-2 -translate-x-1/2 rotate-45 border-line bg-s2 ${
              placement === 'top'
                ? 'top-[calc(100%-4px)] border-b border-r'
                : 'bottom-[calc(100%-4px)] border-t border-l'
            }`}
          />
        </div>
      )}
    </span>
  );
}
