// Card — container có head (title + extra) + body (antd: radiusLG 8, head border-b
// colorBorderSecondary, body padding 24, hoverable = shadow + border accent-less lift).
import type { ReactNode } from 'react';

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
  children?: ReactNode;
  className?: string;
}

export function Card({
  title,
  extra,
  bordered = true,
  hoverable = false,
  cover,
  actions,
  children,
  className,
}: CardProps) {
  return (
    <div
      className={`overflow-hidden rounded-3 bg-s2 ${bordered ? 'border border-line' : ''} ${
        hoverable
          ? 'cursor-pointer transition-shadow hover:border-transparent hover:shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]'
          : ''
      }${className ? ` ${className}` : ''}`}
    >
      {cover}
      {(title || extra) && (
        <div className="flex items-center justify-between border-b border-line2 px-6 py-4">
          <div className="text-body font-semibold text-ink">{title}</div>
          {extra && <div className="text-ink2">{extra}</div>}
        </div>
      )}
      <div className="p-6 text-body">{children}</div>
      {actions && actions.length > 0 && (
        <ul className="m-0 flex list-none gap-0 border-t border-line2 p-0">
          {actions.map((action, i) => (
            <li key={i} className={`flex flex-1 items-center justify-center p-3 text-ink2 ${i > 0 ? 'border-l border-line2' : ''}`}>
              {action}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
