// Progress — line bar (antd): trail colorFillSecondary, stroke accent; % text phải;
// trạng thái success (xanh khi 100) / exception (đỏ).
export interface ProgressProps {
  percent: number;
  /** 'line' (mặc định) — circle bỏ backlog. */
  type?: 'line';
  status?: 'normal' | 'success' | 'exception';
  showInfo?: boolean;
  className?: string;
}

export function Progress({ percent, status = 'normal', showInfo = true, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const barColor =
    status === 'exception' ? 'var(--st-fail)' : percent >= 100 || status === 'success' ? 'var(--st-done)' : 'var(--accent)';
  return (
    <div className={`flex items-center gap-2${className ? ` ${className}` : ''}`}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-pill bg-line2"
      >
        <div className="h-full rounded-pill transition-[width] duration-300" style={{ width: `${clamped}%`, background: barColor }} />
      </div>
      {showInfo && <span className={`w-10 text-right text-body ${status === 'exception' ? 'text-st-fail' : 'text-ink'}`}>{clamped}%</span>}
    </div>
  );
}
