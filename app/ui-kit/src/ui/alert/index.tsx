// Alert — banner thông báo theo type (antd look: tint bg + border + icon chữ).
// Thay error-banner tự chế (.error-banner) ở Tasks/Activity/Login (Tier 2).
// role="alert" GIỮ NGUYÊN — contract tests + màn đọc.
import type { ReactNode } from 'react';

export type AlertType = 'success' | 'info' | 'warning' | 'error';

const TYPE_ICON: Record<AlertType, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

const TYPE_STYLE: Record<AlertType, string> = {
  success: 'border-alert-success-border bg-alert-success-bg text-ink',
  info: 'border-alert-info-border bg-alert-info-bg text-ink',
  warning: 'border-alert-warning-border bg-alert-warning-bg text-ink',
  error: 'border-alert-error-border bg-alert-error-bg text-ink',
};

const TYPE_ICON_COLOR: Record<AlertType, string> = {
  success: 'text-st-done',
  info: 'text-accent',
  warning: 'text-st-doing',
  error: 'text-st-fail',
};

export interface AlertProps {
  type?: AlertType;
  /** Nội dung chính (message). */
  message: ReactNode;
  /** Mô tả phụ (optional — antd description). */
  description?: ReactNode;
  /** Nút đóng (×) — onClick chạy khi bấm. */
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  type = 'info',
  message,
  description,
  closable = false,
  onClose,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-3 border px-3 py-2 text-body ${TYPE_STYLE[type]}${className ? ` ${className}` : ''}`}
    >
      <span aria-hidden="true" className={`text-label leading-5 ${TYPE_ICON_COLOR[type]}`}>
        {TYPE_ICON[type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="leading-5">{message}</div>
        {description && <div className="mt-1 text-meta text-ink2">{description}</div>}
      </div>
      {closable && (
        <button
          type="button"
          aria-label="Đóng"
          className="cursor-pointer border-none bg-transparent text-base leading-5 text-ink3 transition-colors hover:text-ink"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}
