// Statistic — số liệu nổi (antd): title 14 secondary, content 24 semibold tabular,
// prefix/suffix 16px. Thay StatTile (GIỮ ariaLabel contract — wiring ở activity).
// Identity Orbit (PO duyệt 2026-10-20): beam underline chữ ký dưới value — gradient
// sig-hue→accent + glow nhẹ (pseudo absolute, KHÔNG ảnh layout); tắt bằng
// signature={false}.
import type { ReactNode } from 'react';

export interface StatisticProps {
  title?: ReactNode;
  value?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Node thay thế value (antd valueRender lite). */
  valueStyle?: React.CSSProperties;
  /** Beam underline chữ ký Orbit dưới value — mặc định BẬT (identity contract). */
  signature?: boolean;
  className?: string;
}

export function Statistic({ title, value, prefix, suffix, valueStyle, signature = true, className }: StatisticProps) {
  return (
    <div className={className}>
      {title && <div className="mb-1 text-body text-ink3">{title}</div>}
      <div className="flex items-baseline gap-1 text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {prefix && <span className="text-h2 font-semibold">{prefix}</span>}
        <span
          className={`relative inline-block pb-1.5 text-2xl font-semibold leading-[1.2]${
            signature
              ? " after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:max-w-28 after:rounded-full after:bg-[linear-gradient(90deg,var(--sig-hue),var(--accent)_65%,transparent)] after:content-[''] after:shadow-[0_2px_8px_var(--sig-glow)]"
              : ''
          }`}
          style={valueStyle}
        >
          {value}
        </span>
        {suffix && <span className="text-h2 font-semibold">{suffix}</span>}
      </div>
    </div>
  );
}
