// Popconfirm — bubble confirm nhỏ bám trigger (style matrix 2026-10-18: bubble
// rounded-xl, shadow var(--shadow-pop); icon warning tròn, nút small Huỷ/default + OK primary).
// Controlled (open) — TaskItem xoá dùng; ESC = cancel.
import { cloneElement, isValidElement, useEffect, useId, type ReactElement, type ReactNode } from 'react';
import { Button } from '../button/index';

export interface PopconfirmProps {
  /** Controlled mở/đóng bubble. */
  open: boolean;
  /** Nội dung câu hỏi (antd title). */
  title: ReactNode;
  /** Mô tả phụ (antd description). */
  description?: ReactNode;
  /** Nhãn nút xác nhận (mặc định 'OK'). */
  okText?: string;
  /** Nhãn nút huỷ (mặc định 'Huỷ'). */
  cancelText?: string;
  /** Nút OK đỏ (confirm xoá). */
  danger?: boolean;
  /** Xác nhận = click OK (ESC không gọi). */
  onConfirm?: () => void;
  /** Huỷ = click Huỷ / ESC. */
  onCancel?: () => void;
  /** Trigger element — bọc trong span relative (bubble absolute bên dưới). */
  children: ReactNode;
}

export function Popconfirm({
  open,
  title,
  description,
  okText = 'OK',
  cancelText = 'Huỷ',
  danger = false,
  onConfirm,
  onCancel,
  children,
}: PopconfirmProps) {
  // A11y: bubble name qua labelledby — ăn cả title ReactNode, không chỉ string.
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  // Trigger được wire aria-haspopup/aria-expanded (cloneElement) — SR biết bubble đang mở
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
      })
    : children;

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span className="absolute bottom-[calc(100%+10px)] left-0 z-[var(--z-popover)] w-max max-w-xs">
          <span
            role="dialog"
            aria-labelledby={titleId}
            className="block origin-bottom-left rounded-xl border border-line bg-s2 p-3 shadow-[var(--shadow-pop)] animate-[bp-bounce-in_var(--motion-base)_var(--ease-enter)]"
          >
            <span className="flex items-start gap-2">
              {/* Contrast: chữ ĐEN trên gold --st-doing (antd gold-pattern — trắng chỉ ~1.6:1);
                  trắng giữ nguyên trên --st-fail/--st-done (đỏ/xanh đậm đủ tương phản) */}
              <span
                aria-hidden="true"
                className={`grid size-4 shrink-0 place-items-center rounded-pill text-[10px] font-bold ${danger ? 'bg-st-fail text-white' : 'bg-st-doing text-ink'}`}
              >
                !
              </span>
              <span>
                <span id={titleId} className="block text-body font-medium text-ink">{title}</span>
                {description && <span className="mt-1 block text-label text-ink2">{description}</span>}
                <span className="mt-2 flex items-center justify-end gap-2">
                  <Button
                    size="small"
                    onClick={() => onCancel?.()}
                  >
                    {cancelText}
                  </Button>
                  <Button size="small" type="primary" danger={danger} onClick={() => onConfirm?.()}>
                    {okText}
                  </Button>
                </span>
              </span>
            </span>
            <span
              aria-hidden="true"
              className="absolute bottom-[-5px] left-4 size-2 rotate-45 border-b border-r border-line bg-s2"
            />
          </span>
        </span>
      )}
    </span>
  );
}
