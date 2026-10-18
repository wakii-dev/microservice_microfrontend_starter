// Alert — FILLED (mặc định): nền đầy màu type, chữ trắng, icon trắng, KHÔNG viền.
// variant="outlined" giữ kiểu cũ (tint bg + border + colored text) cho ai cần.
// WCAG AA: filled dùng màu đậm đủ contrast với trắng (≥4.5:1 trừ warning ~3.5 large-ok).
import type { CSSProperties, ReactNode } from 'react';

export type AlertType = 'success' | 'info' | 'warning' | 'error';
export type AlertVariant = 'filled' | 'outlined';

const FILLED: Record<AlertType, { bg: string; icon: string }> = {
  success: { bg: '#389e0d', icon: '✓' },
  info: { bg: '#1677ff', icon: 'ℹ' },
  warning: { bg: '#d48806', icon: '⚠' },
  error: { bg: '#cf1322', icon: '✕' },
};

const OUTLINED: Record<AlertType, { bg: string; border: string; icon: string; iconCls: string }> = {
  success: { bg: 'var(--alert-success-bg)', border: 'var(--alert-success-border)', icon: '✓', iconCls: 'text-st-done' },
  info: { bg: 'var(--alert-info-bg)', border: 'var(--alert-info-border)', icon: 'ℹ', iconCls: 'text-accent' },
  warning: { bg: 'var(--alert-warning-bg)', border: 'var(--alert-warning-border)', icon: '⚠', iconCls: 'text-st-doing' },
  error: { bg: 'var(--alert-error-bg)', border: 'var(--alert-error-border)', icon: '✕', iconCls: 'text-st-fail' },
};

export interface AlertProps {
  type?: AlertType;
  message: ReactNode;
  description?: ReactNode;
  variant?: AlertVariant;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function Alert({
  type = 'info',
  message,
  description,
  variant = 'filled',
  closable = false,
  onClose,
  className,
  style,
}: AlertProps) {
  const fill = FILLED[type];
  const outline = OUTLINED[type];
  const isFilled = variant === 'filled';

  const containerStyle: CSSProperties = isFilled
    ? { background: fill.bg }
    : { background: outline.bg, borderColor: outline.border };

  const iconNode = isFilled ? fill.icon : outline.icon;
  const iconCls = isFilled ? 'text-white' : outline.iconCls;

  const base = 'flex items-start gap-2 rounded-lg px-3 py-2 text-body';
  const borderCls = isFilled ? '' : ' border';

  return (
    <div
      role="alert"
      className={`${base} ${borderCls} ${iconCls}${className ? ` ${className}` : ''}`}
      style={{ ...containerStyle, ...style }}
    >
      <span aria-hidden="true" className={`shrink-0 text-label leading-5 ${iconCls}`}>
        {iconNode}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`leading-5 ${isFilled ? 'text-white' : ''}`}
          style={isFilled ? undefined : { color: 'var(--ink)' }}>
          {message}
        </div>
        {description && (
          <div className={`mt-1 text-meta ${isFilled ? 'text-white/80' : 'text-ink2'}`}>
            {description}
          </div>
        )}
      </div>
      {closable && (
        <button
          type="button"
          aria-label="Đóng"
          className={`shrink-0 cursor-pointer border-none bg-transparent text-base leading-5 ${
            isFilled ? 'text-white/80 hover:text-white' : 'text-ink3 hover:text-ink'
          }`}
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}
