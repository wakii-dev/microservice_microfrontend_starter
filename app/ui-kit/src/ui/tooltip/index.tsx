// Tooltip — bubble hint khi hover/focus (antd look: nền spotlight rgba(0,0,0,.85),
// trắng 14px, radius 6? antd tooltip borderRadius = borderRadiusLG? antd tooltip:
// borderRadius 6, padding 6px 8px, max-width 250, mũi tên 8px vuông xoay 45°.
// Placement 'top' (default). Portal-free: absolute trong wrapper relative.
import { useState, type ReactNode } from 'react';

export interface TooltipProps {
  /** Nội dung bubble. */
  title: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ title, children, placement = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex${className ? ` ${className}` : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-[1070] w-max max-w-[250px] -translate-x-1/2 rounded-2 bg-[rgba(0,0,0,0.85)] px-2 py-1.5 text-body text-white ${
            placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
          }`}
        >
          {title}
          <span
            aria-hidden="true"
            className={`absolute left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[rgba(0,0,0,0.85)] ${
              placement === 'top' ? 'top-[calc(100%-4px)]' : 'bottom-[calc(100%-4px)]'
            }`}
          />
        </span>
      )}
    </span>
  );
}
