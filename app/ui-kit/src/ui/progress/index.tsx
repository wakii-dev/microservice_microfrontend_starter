// Progress — line bar (antd): trail colorFillSecondary, stroke accent; % text phải;
// trạng thái success (xanh khi 100) / exception (đỏ).
export interface ProgressProps {
  /** Giá trị 0–100 (clamp khi ngoài khoảng). Bỏ qua khi `indeterminate`. */
  percent?: number;
  /** 'line' (mặc định) — circle bỏ backlog. */
  type?: 'line';
  /** exception = đỏ, success/100% = xanh. */
  status?: 'normal' | 'success' | 'exception';
  /** Hiện % bên phải track. */
  showInfo?: boolean;
  /** Không xác định % — bar chạy vô hạn (loading state; reduced-motion → bar tĩnh 40%). */
  indeterminate?: boolean;
  className?: string;
}

export function Progress({ percent = 0, status = 'normal', showInfo = true, indeterminate = false, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const barColor =
    status === 'exception' ? 'var(--st-fail)' : percent >= 100 || status === 'success' ? 'var(--st-done)' : 'var(--accent)';
  return (
    <div className={`flex items-center gap-2${className ? ` ${className}` : ''}`}>
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-pill bg-line2"
      >
        {indeterminate ? (
          // loading state — bar chạy vô hạn; reduced-motion: block global dừng animation,
          // w-2/5 giữ bar tĩnh nhìn thấy (không biến mất như frame cuối 400%)
          <div
            className="h-full w-2/5 rounded-pill animate-[bp-indeterminate_1.4s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{ background: barColor }}
          />
        ) : (
          <div className="h-full rounded-pill transition-[width] duration-200" style={{ width: `${clamped}%`, background: barColor }} />
        )}
      </div>
      {showInfo && !indeterminate && (
        <span className={`w-10 text-right text-body ${status === 'exception' ? 'text-st-fail' : 'text-ink'}`}>{clamped}%</span>
      )}
    </div>
  );
}
