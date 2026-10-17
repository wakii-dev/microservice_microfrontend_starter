// Drawer — panel trượt từ phải (antd: width 378, mask đen 45%, ESC/mask = onClose,
// motion slide 0.25s). Portal body.
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

export interface DrawerProps {
  open: boolean;
  title?: ReactNode;
  /** px — mặc định 378 (antd). */
  width?: number;
  onClose?: () => void;
  /** Footer (nút actions) — không có → không render footer. */
  footer?: ReactNode;
  children?: ReactNode;
}

export function Drawer({ open, title, width = 378, onClose, footer, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 bg-black/45"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClose?.()}
      data-testid="drawer-overlay"
    >
      <motion.aside
        role="dialog"
        aria-label={typeof title === 'string' ? title : undefined}
        className="absolute inset-y-0 right-0 flex flex-col bg-s2 shadow-[-6px_0_16px_-8px_rgba(0,0,0,0.08),-9px_0_28px_0_rgba(0,0,0,0.05)]"
        style={{ width }}
        initial={{ x: width }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
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
      </motion.aside>
    </motion.div>,
    document.body,
  );
}
