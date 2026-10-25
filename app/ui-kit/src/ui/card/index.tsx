// Card — container có head (title + extra) + body (antd: radiusLG 8, head border-b
// colorBorderSecondary, body padding 24, hoverable = shadow + border accent-less lift).
// loading = skeleton body (antd Card loading); size small = padding dense (antd size).
// Customize pass (SÓNG-3): classNames slots (root/header/title/extra/body/actions)
// + style passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '../skeleton/index.js';

/** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định (consumer append). */
export interface CardClassNames {
  /** Div gốc bọc cả card. */
  root?: string;
  /** Dải head (title + extra) — chỉ render khi có title/extra. */
  header?: string;
  /** Div title trong head. */
  title?: string;
  /** Div extra (góc phải head) — chỉ render khi có extra. */
  extra?: string;
  /** Div body (children / skeleton). */
  body?: string;
  /** <ul> hàng actions dưới body — chỉ render khi có actions. */
  actions?: string;
}

export interface CardProps {
  title?: ReactNode;
  /** Node góc phải head (antd extra). */
  extra?: ReactNode;
  bordered?: boolean;
  /** Hover: nền s3 + shadow (antd hoverable). */
  hoverable?: boolean;
  /** Nền cover trên head (antd cover). */
  cover?: ReactNode;
  /** Actions row dưới body (antd actions — border-top line2). */
  actions?: ReactNode[];
  /** Body thay bằng skeleton bones khi true (antd loading). */
  loading?: boolean;
  /** 'default' (padding 24) | 'small' (padding dense — antd size="small"). */
  size?: 'default' | 'small';
  children?: ReactNode;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (SÓNG-3) — merge sau class mặc định. */
  classNames?: CardClassNames;
}

// slot helper — ghép class consumer vào sau mặc định (undefined → rỗng)
const slot = (c?: string) => (c ? ` ${c}` : '');

const PAD = {
  default: { head: 'px-6 py-4', body: 'p-6', action: 'p-3' },
  small: { head: 'px-3 py-2', body: 'p-3', action: 'p-2' },
} as const;

export function Card({
  title,
  extra,
  bordered = true,
  hoverable = false,
  cover,
  actions,
  loading = false,
  size = 'default',
  children,
  className,
  style,
  classNames,
}: CardProps) {
  const pad = PAD[size];
  return (
    <div
      className={`overflow-hidden rounded-xl bg-s2 shadow-[var(--ele-1)] ${bordered ? 'border border-line' : ''} ${
        hoverable
          ? // Depth contract (direction-approved): hover nhấc 1 bậc ele-1→ele-3 + viền
            // đậm mực 20% + dịch bề mặt 1px; press chìm lại + bóng nén về ele-2.
            // KHÔNG scale; mọi transition ease-smooth 200ms.
            'cursor-pointer transition-[box-shadow,border-color,transform] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-3)] hover:border-ink/20 hover:-translate-y-px active:translate-y-0 active:shadow-[var(--ele-2)]'
          : ''
      }${slot(classNames?.root)}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {cover}
      {(title || extra) && (
        <div className={`flex items-center justify-between border-b border-line2 ${pad.head}${slot(classNames?.header)}`}>
          <div className={`text-body font-semibold text-ink${slot(classNames?.title)}`}>{title}</div>
          {extra && <div className={`text-ink2${slot(classNames?.extra)}`}>{extra}</div>}
        </div>
      )}
      <div className={`${pad.body} text-body${slot(classNames?.body)}`}>
        {loading ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Đang tải">
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="row" />
          </div>
        ) : (
          children
        )}
      </div>
      {actions && actions.length > 0 && (
        <ul className={`m-0 flex list-none gap-0 border-t border-line2 p-0${slot(classNames?.actions)}`}>
          {actions.map((action, i) => (
            <li key={i} className={`flex flex-1 items-center justify-center text-ink2 ${pad.action} ${i > 0 ? 'border-l border-line2' : ''}`}>
              {action}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
