// Tooltip — bubble hint khi hover/focus (antd look: nền spotlight --tooltip-bg,
// trắng 14px, radius 8, padding 6px 8px, max-width 250, mũi tên 8px vuông xoay 45°.
// Placement top/bottom/left/right (default 'top') + auto-flip sát mép viewport
// (useAutoFlipPlacement — đo trước paint, dùng chung Popover). Portal-free:
// absolute trong wrapper relative.
// A11y: bubble id + trigger aria-describedby (cloneElement), ESC đóng khi đang mở.
// Customize pass (slots wave 3): classNames slots (trigger/bubble) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import { cloneElement, isValidElement, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { useAutoFlipPlacement, type FlipPlacement } from '../popover/auto-flip.js';

/** Vị trí bubble theo placement (center dọc/ngang đi kèm). */
const BUBBLE_POSITION: Record<FlipPlacement, string> = {
  top: 'left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)]',
  bottom: 'left-1/2 -translate-x-1/2 top-[calc(100%+8px)]',
  left: 'top-1/2 -translate-y-1/2 right-[calc(100%+8px)]',
  right: 'top-1/2 -translate-y-1/2 left-[calc(100%+8px)]',
};

/** Mũi tên: nửa chìa ra ngoài mép bubble quay về trigger. */
const ARROW_POSITION: Record<FlipPlacement, string> = {
  top: 'left-1/2 -translate-x-1/2 top-[calc(100%-4px)]',
  bottom: 'left-1/2 -translate-x-1/2 bottom-[calc(100%-4px)]',
  left: 'top-1/2 -translate-y-1/2 left-[calc(100%-4px)]',
  right: 'top-1/2 -translate-y-1/2 right-[calc(100%-4px)]',
};

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface TooltipClassNames {
  /** Wrapper span bọc trigger tại chỗ — context định vị bubble (nơi className prop cũng dính). */
  trigger?: string;
  /** Bubble role="tooltip" (không gồm arrow — arrow kế thừa nền bubble). */
  bubble?: string;
}

export interface TooltipProps {
  /** Nội dung bubble. */
  title: ReactNode;
  /** Trigger — bubble bọc quanh element này (hover/focus mở). */
  children: ReactNode;
  /** Vị trí bubble so với trigger. Sát mép viewport → tự lật. */
  placement?: FlipPlacement;
  className?: string;
  /** Inline style — passthrough lên wrapper span (root). */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: TooltipClassNames;
}

export function Tooltip(props: TooltipProps) {
  const { title, children, placement = 'top', className, style } = props;
  const [open, setOpen] = useState(false);
  const bubbleId = useId();
  // Auto-flip: đo bubble sau khi mở, lật placement nếu sát mép viewport
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const shownPlacement = useAutoFlipPlacement(open, placement, bubbleRef);

  const onKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Escape') setOpen(false);
  };

  // Wire aria-describedby thẳng lên trigger element (SR đọc bubble khi focus trigger)
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-describedby': open ? bubbleId : undefined,
      })
    : children;

  return (
    <span
      className={classNames('relative inline-flex', props.classNames?.trigger, className)}
      style={style}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={onKeyDown}
    >
      {trigger}
      {open && (
        <span
          ref={bubbleRef}
          role="tooltip"
          id={bubbleId}
          className={classNames(
            'pointer-events-none absolute z-[var(--z-tooltip)] w-max max-w-[250px] rounded-lg bg-[var(--tooltip-bg)] px-2 py-1.5 text-body text-white animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]',
            BUBBLE_POSITION[shownPlacement],
            props.classNames?.bubble,
          )}
        >
          {title}
          <span
            aria-hidden="true"
            className={`absolute size-2 rotate-45 bg-[var(--tooltip-bg)] ${ARROW_POSITION[shownPlacement]}`}
          />
        </span>
      )}
    </span>
  );
}
