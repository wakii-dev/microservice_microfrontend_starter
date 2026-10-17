// Drawer — panel trượt từ phải (antd: width 378, mask, ESC/mask = onClose).
// Motion identity (CSS thuần): slide-in khi mở, slide-out khi đóng — closing state
// machine: open=false → animation chạy XONG (onAnimationEnd) mới unmount.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  open: boolean;
  title?: ReactNode;
  /** px — mặc định 378 (antd). */
  width?: number;
  onClose?: () => void;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Drawer({ open, title, width = 378, onClose, footer, children, className }: DrawerProps) {
  const [mounted, setMounted] = useState(open);
  const closing = mounted && !open;

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // ESC chỉ khi open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Scroll lock giữ tới mounted=false (exit animation XONG)
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 bg-black/45 ${closing ? 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-fade-in_var(--motion-base)_var(--ease-enter)]'}`}
      onClick={() => onClose?.()}
      data-testid="drawer-overlay"
    >
      <aside
        role="dialog"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`absolute inset-y-0 right-0 flex flex-col bg-s2 shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.08),-9px_0_28px_0_rgba(0,0,0,0.05)] ${closing ? 'animate-[bp-slide-out-right_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-slide-in-right_var(--motion-base)_var(--ease-enter)]'}${className ? ` ${className}` : ''}`}
        style={{ width }}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) setMounted(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-line2 px-6 py-4">
          <div className="text-h2 font-semibold text-ink">{title}</div>
          <button
            type="button"
            aria-label="Đóng"
            className="cursor-pointer border-none bg-transparent text-lg leading-4 text-ink3 hover:text-ink"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-auto p-6 text-body text-ink2">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line2 p-4">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
