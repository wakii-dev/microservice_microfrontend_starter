// Statistic — số liệu nổi (antd): title 14 secondary, content 24 semibold tabular,
// prefix/suffix 16px. Thay StatTile (GIỮ ariaLabel contract — wiring ở activity).
import type { ReactNode } from 'react';

export interface StatisticProps {
  title?: ReactNode;
  value?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Node thay thế value (antd valueRender lite). */
  valueStyle?: React.CSSProperties;
  className?: string;
}

export function Statistic({ title, value, prefix, suffix, valueStyle, className }: StatisticProps) {
  return (
    <div className={className}>
      {title && <div className="mb-1 text-body text-ink3">{title}</div>}
      <div className="flex items-baseline gap-1 text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {prefix && <span className="text-h2 font-semibold">{prefix}</span>}
        <span className="text-2xl font-semibold leading-[1.2]" style={valueStyle}>
          {value}
        </span>
        {suffix && <span className="text-h2 font-semibold">{suffix}</span>}
      </div>
    </div>
  );
}
