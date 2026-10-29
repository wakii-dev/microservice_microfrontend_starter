// Progress — line bar (antd): trail colorFillSecondary, stroke accent; % text phải;
// trạng thái success (xanh khi 100) / exception (đỏ). type="circle" (MUI/antd parity):
// SVG dash arc — stroke accent/trạng thái, indeterminate quay (reduced-motion → tĩnh).
// Customize pass (slots wave 3): classNames slots (root/track/bar/info) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties } from 'react';

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface ProgressClassNames {
  /** Div gốc bọc track + % info (nơi className prop cũng dính). */
  root?: string;
  /** Div role="progressbar" — track nền trail. */
  track?: string;
  /** Div fill bên trong track (width % / indeterminate). */
  bar?: string;
  /** Span % bên phải — chỉ render khi showInfo && !indeterminate. */
  info?: string;
}

export interface ProgressProps {
  /** Giá trị 0–100 (clamp khi ngoài khoảng). Bỏ qua khi `indeterminate`. */
  percent?: number;
  /** 'line' (default) or 'circle' (SVG dash arc). */
  type?: 'line' | 'circle';
  /** Circle diameter in px (type="circle" only; default 40). */
  size?: number;
  /** Accessible name for the circle <svg role="progressbar">. */
  ariaLabel?: string;
  /** exception = đỏ, success/100% = xanh. */
  status?: 'normal' | 'success' | 'exception';
  /** Hiện % bên phải track. */
  showInfo?: boolean;
  /** Không xác định % — bar chạy vô hạn (loading state; reduced-motion → bar tĩnh 40%). */
  indeterminate?: boolean;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: ProgressClassNames;
}

export function Progress(props: ProgressProps) {
  const { percent = 0, status = 'normal', showInfo = true, indeterminate = false, type = 'line', size, ariaLabel, className, style } = props;
  const clamped = Math.min(100, Math.max(0, percent));
  const barColor =
    status === 'exception' ? 'var(--st-fail)' : percent >= 100 || status === 'success' ? 'var(--st-done)' : 'var(--accent)';
  if (type === 'circle') {
    const s = size ?? 40;
    const stroke = 4;
    const r = (s - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const arcLen = indeterminate ? circ * 0.25 : circ;
    const offset = indeterminate ? circ * 0.375 : circ * (1 - clamped / 100);
    return (
      <div
        className={classNames('relative inline-flex items-center justify-center', props.classNames?.root, className)}
        style={style}
      >
        <svg
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={indeterminate ? undefined : clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          width={s}
          height={s}
          viewBox={`0 0 ${s} ${s}`}
          className={classNames(indeterminate && 'animate-spin motion-reduce:animate-none', props.classNames?.track)}
        >
          <circle cx={s / 2} cy={s / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'var(--line2)' }} />
          <circle
            cx={s / 2}
            cy={s / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${s / 2} ${s / 2})`}
            className={classNames('transition-[stroke-dashoffset] duration-200', props.classNames?.bar)}
            style={{ stroke: barColor }}
          />
        </svg>
        {showInfo && !indeterminate && (
          <span className={classNames('absolute inset-0 flex items-center justify-center text-label', props.classNames?.info)}>
            {clamped}%
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={classNames('flex items-center gap-2', props.classNames?.root, className)} style={style}>
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={classNames('h-2 flex-1 overflow-hidden rounded-pill bg-line2', props.classNames?.track)}
      >
        {indeterminate ? (
          // loading state — bar chạy vô hạn; reduced-motion: block global dừng animation,
          // w-2/5 giữ bar tĩnh nhìn thấy (không biến mất như frame cuối 400%)
          <div
            className={classNames(
              'h-full w-2/5 rounded-pill animate-[bp-indeterminate_1.4s_ease-in-out_infinite] motion-reduce:animate-none',
              props.classNames?.bar,
            )}
            style={{ background: barColor }}
          />
        ) : (
          <div
            className={classNames('h-full rounded-pill transition-[width] duration-200', props.classNames?.bar)}
            style={{ width: `${clamped}%`, background: barColor }}
          />
        )}
      </div>
      {showInfo && !indeterminate && (
        <span
          className={classNames(
            'w-10 text-right text-body',
            status === 'exception' ? 'text-st-fail' : 'text-ink',
            props.classNames?.info,
          )}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
