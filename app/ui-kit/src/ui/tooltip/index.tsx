// Tooltip — bubble hint khi hover/focus (antd look: nền spotlight --tooltip-bg,
// trắng 14px, radius 8, padding 6px 8px, max-width 250, mũi tên 8px vuông xoay 45°.
// Placement 'top' (default). Portal-free: absolute trong wrapper relative.
// A11y: bubble id + trigger aria-describedby (cloneElement), ESC đóng khi đang mở.
// Customize pass (slots wave 3): classNames slots (trigger/bubble) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import { cloneElement, isValidElement, useId, useState, type CSSProperties, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';

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
  /** Vị trí bubble so với trigger. */
  placement?: 'top' | 'bottom';
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
          role="tooltip"
          id={bubbleId}
          className={classNames(
            'pointer-events-none absolute left-1/2 z-[var(--z-tooltip)] w-max max-w-[250px] -translate-x-1/2 rounded-lg bg-[var(--tooltip-bg)] px-2 py-1.5 text-body text-white animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]',
            placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
            props.classNames?.bubble,
          )}
        >
          {title}
          <span
            aria-hidden="true"
            className={`absolute left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[var(--tooltip-bg)] ${
              placement === 'top' ? 'top-[calc(100%-4px)]' : 'bottom-[calc(100%-4px)]'
            }`}
          />
        </span>
      )}
    </span>
  );
}
