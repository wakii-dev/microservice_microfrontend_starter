// Modal — hộp thoại确认 (antd look: centered, overlay, radius-3, motion fade/zoom).
// Portal vào document.body; ESC + click overlay = cancel. Ok/Cancel dùng Button ui-kit
// (danger khi danger — xoá-confirm pattern của TaskItem).
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Button } from '../button/index';

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  okText?: string;
  cancelText?: string;
  /** Nút OK đỏ (confirm xoá). */
  danger?: boolean;
  confirmLoading?: boolean;
  onOk?: () => void;
  onCancel?: () => void;
}

export function Modal({
  open,
  title,
  children,
  okText = 'OK',
  cancelText = 'Huỷ',
  danger = false,
  confirmLoading = false,
  onOk,
  onCancel,
}: ModalProps) {
  // ESC = cancel; lock scroll khi open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={() => onCancel?.()}
      data-testid="modal-overlay"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className="w-full max-w-[416px] rounded-3 bg-s2 p-6 shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 text-h2 font-semibold text-ink">{title}</div>
        {children && <div className="text-body text-ink2">{children}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="default" onClick={() => onCancel?.()} disabled={confirmLoading}>
            {cancelText}
          </Button>
          <Button type="primary" danger={danger} onClick={() => onOk?.()} disabled={confirmLoading}>
            {confirmLoading ? 'Đang xử lý…' : okText}
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
