// Tooltip — bubble hint khi hover/focus (antd look: nền spotlight bg-black/85,
// trắng 14px, radius 8, padding 6px 8px, max-width 250, mũi tên 8px vuông xoay 45°.
// Placement 'top' (default). Portal-free: absolute trong wrapper relative.
// A11y: bubble id + trigger aria-describedby (cloneElement), ESC đóng khi đang mở.
import { cloneElement, isValidElement, useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';

export interface TooltipProps {
  /** Nội dung bubble. */
  title: ReactNode;
  /** Trigger — bubble bọc quanh element này (hover/focus mở). */
  children: ReactNode;
  /** Vị trí bubble so với trigger. */
  placement?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ title, children, placement = 'top', className }: TooltipProps) {
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
      className={`relative inline-flex${className ? ` ${className}` : ''}`}
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
          className={`pointer-events-none absolute left-1/2 z-[var(--z-tooltip)] w-max max-w-[250px] -translate-x-1/2 rounded-lg bg-black/85 px-2 py-1.5 text-body text-white animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)] ${
            placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
          }`}
        >
          {title}
          <span
            aria-hidden="true"
            className={`absolute left-1/2 size-2 -translate-x-1/2 rotate-45 bg-black/85 ${
              placement === 'top' ? 'top-[calc(100%-4px)]' : 'bottom-[calc(100%-4px)]'
            }`}
          />
        </span>
      )}
    </span>
  );
}
