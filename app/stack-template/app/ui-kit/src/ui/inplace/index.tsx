// Inplace — click-to-edit toggle (antd lite). Depth contract 2026-10-19:
// hover tint accent/4 + press chìm 1px, transition ease-smooth 240ms.
import { useState, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface InplaceProps {
  /** Nội dung hiển thị khi đóng. */
  display: ReactNode;
  /** Nội dung edit form khi mở. */
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Inplace({ display, children, onClose, className }: InplaceProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      {open ? (
        <span className="inline-flex items-center gap-2">
          {children}
          <button type="button" aria-label="Đóng" onClick={() => { setOpen(false); onClose?.(); }}
            className="cursor-pointer border-none bg-transparent text-label text-ink3 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"><Icon name="times" size={12} /></button>
        </span>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="cursor-pointer rounded-lg border border-dashed border-line bg-transparent px-2 py-1 text-body text-ink2 transition-[color,border-color,background-color,transform] duration-[240ms] [transition-timing-function:var(--ease-smooth)] hover:border-accent hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] hover:text-ink active:translate-y-px focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
          {display}
        </button>
      )}
    </div>
  );
}
