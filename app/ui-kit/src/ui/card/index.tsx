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
      className={`relative overflow-hidden rounded-xl bg-s2 shadow-[var(--ele-1)] ${bordered ? 'border border-line' : ''} ${
        hoverable
          ? // Depth contract (direction-approved): hover nhấc 1 bậc ele-1→ele-3 + viền
            // đậm mực 20% + dịch bề mặt 1px; press chìm lại + bóng nén về ele-2.
            // KHÔNG scale; mọi transition ease-smooth 200ms.
            'cursor-pointer transition-[box-shadow,border-color,transform] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-3)] hover:border-ink/20 hover:-translate-y-px active:translate-y-0 active:shadow-[var(--ele-2)]'
          : ''
      }${className ? ` ${className}` : ''}`}
    >
      {/* Identity Orbit — dot-grid góc thẻ quan trọng (radial-gradient token, mờ,
          mask tan dần về tâm; root đã overflow-hidden nên không tràn bo góc). */}
      {hoverable && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2 size-20 opacity-70 [background-image:radial-gradient(color-mix(in_srgb,var(--sig-hue)_30%,transparent)_1.5px,transparent_1.5px)] [background-size:9px_9px] [mask-image:radial-gradient(75%_75%_at_75%_25%,black,transparent)] [-webkit-mask-image:radial-gradient(75%_75%_at_75%_25%,black,transparent)]"
        />
      )}
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
