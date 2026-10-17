// Inplace — click-to-edit toggle (antd lite).
import { useState, type ReactNode } from 'react';

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
            className="cursor-pointer border-none bg-transparent text-label text-ink3 hover:text-ink">✕</button>
        </span>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="cursor-pointer rounded-2 border border-dashed border-line bg-transparent px-2 py-1 text-body text-ink2 transition-colors hover:border-accent hover:text-ink">
          {display}
        </button>
      )}
    </div>
  );
}
