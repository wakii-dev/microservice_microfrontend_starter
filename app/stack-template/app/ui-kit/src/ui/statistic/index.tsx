// Statistic — số liệu nổi (antd): title 14 secondary, content 24 semibold tabular,
// prefix/suffix 16px. Thay StatTile (GIỮ ariaLabel contract — wiring ở activity).
// Customize pass (slots wave 3): classNames slots (root/title/value/prefix/suffix)
// + style passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface StatisticClassNames {
  /** Div gốc bọc title + value row (nơi className prop cũng dính). */
  root?: string;
  /** Div tiêu đề — chỉ render khi có title. */
  title?: string;
  /** Span giá trị chính (valueStyle vẫn đè style inline riêng của value). */
  value?: string;
  /** Span prefix trước value — chỉ render khi có prefix. */
  prefix?: string;
  /** Span suffix sau value — chỉ render khi có suffix. */
  suffix?: string;
}

export interface StatisticProps {
  title?: ReactNode;
  value?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Node thay thế value (antd valueRender lite). */
  valueStyle?: CSSProperties;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: StatisticClassNames;
}

export function Statistic(props: StatisticProps) {
  const { title, value, prefix, suffix, valueStyle, className, style } = props;
  return (
    <div className={classNames(props.classNames?.root, className)} style={style}>
      {title && <div className={classNames('mb-1 text-body text-ink3', props.classNames?.title)}>{title}</div>}
      <div className="flex items-baseline gap-1 text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {prefix && <span className={classNames('text-h2 font-semibold', props.classNames?.prefix)}>{prefix}</span>}
        <span className={classNames('text-2xl font-semibold leading-[1.2]', props.classNames?.value)} style={valueStyle}>
          {value}
        </span>
        {suffix && <span className={classNames('text-h2 font-semibold', props.classNames?.suffix)}>{suffix}</span>}
      </div>
    </div>
  );
}
