// Modal — hộp thoại confirm (style matrix 2026-10-18: rounded-xl, shadow
// var(--shadow-pop)). Motion identity (CSS): zoom-in mở / zoom-out đóng — closing
// state machine: open=false → animation XONG mới unmount. ESC + overlay = cancel.
// A11y (batch ⑫ worker C): focus trap (Tab/Shift+Tab vòng trong dialog), mở →
// focus phần tử đầu, đóng → trả focus về trigger (capture document.activeElement).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../button/index';
import { Icon } from '../icons/index.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

/** antd v5-style sub-part slot classes — merge AFTER defaults (consumer appends). */
export interface ModalClassNames {
  /** Dialog panel (rounded card). */
  wrapper?: string;
  /** Fullscreen dim overlay. */
  mask?: string;
  /** Title line. */
  header?: string;
  /** Body content area. */
  body?: string;
  /** Action buttons row. */
  footer?: string;
  /** Close × button (top-right). */
  closeButton?: string;
}

export interface ModalProps {
  /** Mở/đóng (đóng có exit animation trước khi unmount). */
  open: boolean;
  /** Tiêu đề (string → làm aria-label dialog). */
  title: ReactNode;
  /** Nội dung thân hộp thoại. */
  children?: ReactNode;
  /** Nhãn nút xác nhận (mặc định 'OK'). */
  okText?: string;
  /** Nhãn nút huỷ (mặc định 'Huỷ'). */
  cancelText?: string;
  /** Nút OK đỏ (hành động phá hủy). */
  danger?: boolean;
  /** Đang xử lý — khoá 2 nút, OK hiện 'Đang xử lý…'. */
  confirmLoading?: boolean;
  onOk?: () => void;
  /** Huỷ = ESC / click overlay / nút Huỷ / nút ×. */
  onCancel?: () => void;
  className?: string;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: ModalClassNames;
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
  classNames,
}: ModalProps) {
  // A11y: dialog name qua labelledby — ăn cả title ReactNode (icon/badge), không
  // chỉ title string như aria-label cũ.
  const titleId = useId();
  const [mounted, setMounted] = useState(open);
  const closing = mounted && !open;
  const dialogRef = useRef<HTMLDivElement>(null);

  // active = open && mounted: mở → focus đầu; bắt đầu closing → trả focus trigger
  useFocusTrap(dialogRef, open && mounted);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // ESC chỉ khi open (không khi closing)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  // Scroll lock giữ tới mounted=false (exit animation XONG) — không release sớm
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mounted]);

  if (!mounted) return null;

  // slot helper — ghép class consumer vào sau mặc định (undefined → rỗng)
  const slot = (c?: string) => (c ? ` ${c}` : '');

  return createPortal(
    <div
      className={`fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[var(--mask)] p-4 ${closing ? 'animate-[bp-fade-out_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-fade-in_var(--motion-instant)_var(--ease-enter)]'}${className ? ` ${className}` : ''}${slot(classNames?.mask)}`}
      onClick={() => onCancel?.()}
      data-testid="modal-overlay"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        style={{ willChange: "transform, opacity" }}
        className={`relative w-full max-w-[416px] rounded-xl bg-s2 p-6 shadow-[var(--shadow-pop)] ${closing ? 'animate-[bp-zoom-out_var(--motion-fast)_var(--ease-exit)]' : 'animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)]'}${slot(classNames?.wrapper)}`}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) setMounted(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div id={titleId} className={`mb-2 text-h2 font-semibold text-ink${slot(classNames?.header)}`}>{title}</div>
        {children && <div className={`text-body text-ink2${slot(classNames?.body)}`}>{children}</div>}
        <div className={`mt-4 flex justify-end gap-2${slot(classNames?.footer)}`}>
          <Button type="default" onClick={() => onCancel?.()} disabled={confirmLoading}>
            {cancelText}
          </Button>
          <Button type="primary" danger={danger} onClick={() => onOk?.()} disabled={confirmLoading}>
            {confirmLoading ? 'Đang xử lý…' : okText}
          </Button>
        </div>
        {/* Nút × đóng (antd closable) — cuối DOM để focus-trap giữ Huỷ làm phần tử đầu */}
        <button
          type="button"
          aria-label="Đóng"
          className={`absolute right-4 top-4 cursor-pointer rounded-1 border-none bg-transparent text-base leading-4 text-ink3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:opacity-70${slot(classNames?.closeButton)}`}
          onClick={() => onCancel?.()}
        >
          <Icon name="times" size={14} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
