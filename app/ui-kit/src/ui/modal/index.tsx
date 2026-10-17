// Modal — hộp thoại confirm (antd look: centered, overlay, radius-3, shadow
// boxShadowSecondary). Motion identity (CSS): zoom-in mở / zoom-out đóng — closing
// state machine: open=false → animation XONG mới unmount. ESC + overlay = cancel.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../button/index';

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  confirmLoading?: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  className?: string;
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
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const closing = mounted && !open;

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

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

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 ${closing ? 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-fade-in_var(--motion-instant)_var(--ease-enter)]'}${className ? ` ${className}` : ''}`}
      onClick={() => onCancel?.()}
      data-testid="modal-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`w-full max-w-[416px] rounded-3 bg-s2 p-6 shadow-[var(--shadow-pop)] ${closing ? 'animate-[bp-zoom-out_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)]'}`}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) setMounted(false);
        }}
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
      </div>
    </div>,
    document.body,
  );
}
