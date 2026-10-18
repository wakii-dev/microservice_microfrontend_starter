// Card — container có head (title + extra) + body (antd: radiusLG 8, head border-b
// colorBorderSecondary, body padding 24, hoverable = shadow + border accent-less lift).
// loading = skeleton body (antd Card loading); size small = padding dense (antd size).
import type { ReactNode } from 'react';
import { Skeleton } from '../skeleton/index.js';

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
}

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
}: CardProps) {
  const pad = PAD[size];
  return (
    <div
      className={`overflow-hidden rounded-xl bg-s2 ${bordered ? 'border border-line' : ''} ${
        hoverable
          ? 'cursor-pointer transition-shadow hover:border-transparent hover:bg-s3 hover:shadow-[var(--shadow-lift)] hover:-translate-y-px'
          : ''
      }${className ? ` ${className}` : ''}`}
    >
      {cover}
      {(title || extra) && (
        <div className={`flex items-center justify-between border-b border-line2 ${pad.head}`}>
          <div className="text-body font-semibold text-ink">{title}</div>
          {extra && <div className="text-ink2">{extra}</div>}
        </div>
      )}
      <div className={`${pad.body} text-body`}>
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
        <ul className="m-0 flex list-none gap-0 border-t border-line2 p-0">
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
