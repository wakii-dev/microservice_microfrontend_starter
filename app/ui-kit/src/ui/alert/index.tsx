// Alert — FILLED (mặc định): nền đặc token --alert-*-filled, chữ trắng, icon trắng, KHÔNG viền.
// variant="outlined" giữ kiểu cũ (tint bg + border + colored text) cho ai cần.
// WCAG AA: filled dùng màu đậm đủ contrast với trắng (≥4.5:1 trừ warning ~3.5 large-ok).
// Customize pass (slots wave 3): ghép slot qua package classnames (bỏ slot helper).
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../icons/index.js';

export type AlertType = 'success' | 'info' | 'warning' | 'error';
export type AlertVariant = 'filled' | 'outlined';

const FILLED: Record<AlertType, { bg: string; icon: IconName }> = {
  success: { bg: 'var(--alert-success-filled)', icon: 'check' },
  info: { bg: 'var(--alert-info-filled)', icon: 'info-circle' },
  warning: { bg: 'var(--alert-warning-filled)', icon: 'exclamation-triangle' },
  error: { bg: 'var(--alert-error-filled)', icon: 'times' },
};

const OUTLINED: Record<AlertType, { bg: string; border: string; icon: IconName; iconCls: string }> = {
  success: { bg: 'var(--alert-success-bg)', border: 'var(--alert-success-border)', icon: 'check', iconCls: 'text-st-done' },
  info: { bg: 'var(--alert-info-bg)', border: 'var(--alert-info-border)', icon: 'info-circle', iconCls: 'text-accent' },
  warning: { bg: 'var(--alert-warning-bg)', border: 'var(--alert-warning-border)', icon: 'exclamation-triangle', iconCls: 'text-st-doing' },
  error: { bg: 'var(--alert-error-bg)', border: 'var(--alert-error-border)', icon: 'times', iconCls: 'text-st-fail' },
};

/** antd v5-style sub-part slot classes — merge AFTER defaults (consumer appends). */
export interface AlertClassNames {
  /** Root container (role=alert). */
  wrapper?: string;
  /** Leading status glyph. */
  icon?: string;
  /** Primary message line. */
  message?: string;
  /** Secondary description line. */
  description?: string;
  /** Close × button. */
  closeButton?: string;
}

export interface AlertProps {
  /** Loại trạng thái — quyết định màu nền filled / tint outlined. */
  type?: AlertType;
  /** Dòng chính. */
  message: ReactNode;
  /** Dòng phụ chi tiết. */
  description?: ReactNode;
  /** filled (mặc định) / outlined. */
  variant?: AlertVariant;
  /** Hiện nút × đóng. */
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: AlertClassNames;
}

export function Alert(props: AlertProps) {
  const {
    type = 'info',
    message,
    description,
    variant = 'filled',
    closable = false,
    onClose,
    className,
    style,
  } = props;
  const slots = props.classNames;
  const fill = FILLED[type];
  const outline = OUTLINED[type];
  const isFilled = variant === 'filled';

  const containerStyle: CSSProperties = isFilled
    ? { background: fill.bg }
    : { background: outline.bg, borderColor: outline.border };

  const iconNode = isFilled ? fill.icon : outline.icon;
  const iconCls = isFilled ? 'text-white' : outline.iconCls;

  const base = 'flex items-start gap-2 rounded-lg px-3 py-2 text-body';
  const borderCls = isFilled ? '' : 'border';

  return (
    <div
      role="alert"
      className={classNames(base, borderCls, iconCls, className, slots?.wrapper)}
      style={{ ...containerStyle, ...style }}
    >
      <span aria-hidden="true" className={classNames('shrink-0 text-label leading-5', iconCls, slots?.icon)}>
        <Icon name={iconNode} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={classNames('leading-5', isFilled ? 'text-white' : '', slots?.message)}
          style={isFilled ? undefined : { color: 'var(--ink)' }}
        >
          {message}
        </div>
        {description && (
          <div className={classNames('mt-1 text-label', isFilled ? 'text-white/80' : 'text-ink2', slots?.description)}>
            {description}
          </div>
        )}
      </div>
      {closable && (
        <button
          type="button"
          aria-label="Đóng"
          className={classNames(
            'shrink-0 cursor-pointer border-none bg-transparent text-base leading-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-1 active:opacity-70',
            slots?.closeButton,
            isFilled ? 'text-white/80 hover:text-white' : 'text-ink3 hover:text-ink',
          )}
          onClick={onClose}
        >
          <Icon name="times" size={14} />
        </button>
      )}
    </div>
  );
}
