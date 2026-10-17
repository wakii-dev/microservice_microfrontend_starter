// Popconfirm — bubble confirm nhỏ bám trigger (antd look: icon warning tròn, title 14
// semibold?, nút small Huỷ/default + OK primary; radius 8, shadow popover, mũi tên).
// Controlled (open) — TaskItem xoá dùng; ESC = cancel.
import { useEffect, type ReactNode } from 'react';
import { Button } from '../button/index';

export interface PopconfirmProps {
  open: boolean;
  /** Nội dung câu hỏi (antd title). */
  title: ReactNode;
  /** Mô tả phụ (antd description). */
  description?: ReactNode;
  okText?: string;
  cancelText?: string;
  /** Nút OK đỏ (confirm xoá). */
  danger?: boolean;
  onConfirm?: () => void;
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <span className="relative inline-flex">
      {children}
      {open && (
        <span className="absolute bottom-[calc(100%+10px)] left-0 z-30 w-max max-w-xs">
          <span className="block rounded-3 border border-line bg-s2 p-3 shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]">
            <span className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={`grid size-4 shrink-0 place-items-center rounded-pill text-[10px] font-bold text-white ${danger ? 'bg-st-fail' : 'bg-st-doing'}`}
              >
                !
              </span>
              <span>
                <span className="block text-body font-medium text-ink">{title}</span>
                {description && <span className="mt-1 block text-meta text-ink2">{description}</span>}
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
