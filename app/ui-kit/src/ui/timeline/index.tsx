// Timeline — activity feed vertical (antd lite): dot + content + time, rail dọc.
// mode (antd parity): 'left' = label trái / content phải; 'right' = ngược;
// 'alternate' = xen kẽ theo chỉ mục. Mặc định (không mode): label dưới content.
// pending: item cuối dot rỗng (antd pending — trạng thái "đang diễn ra").
import type { ReactNode } from 'react';

export interface TimelineItem {
  key: string;
  /** Dot màu (var(--accent), var(--st-done)…) hoặc children tuỳ ý. */
  color?: string;
  children: ReactNode;
  /** Label bên phải (time) — hoặc cột trái khi có mode. */
  label?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Bố cục antd: 'left' | 'right' | 'alternate' — label thành cột riêng. */
  mode?: 'left' | 'right' | 'alternate';
  /** Node cuối — dot rỗng nối từ item cuối (antd pending). */
  pending?: ReactNode;
  className?: string;
}

const RAIL_LINE = 'before:absolute before:left-1/2 before:top-4 before:h-full before:w-px before:-translate-x-1/2 before:bg-line before:content-[""]';

export function Timeline({ items, mode, pending, className }: TimelineProps) {
  const hasPending = pending !== undefined;

  if (mode) {
    return (
      <ol className={`m-0 list-none p-0${className ? ` ${className}` : ''}`}>
        {items.map((item, i) => {
          // left: label trái — right: label phải — alternate: xen kẽ even/odd
          const labelLeft = mode === 'left' || (mode === 'alternate' && i % 2 === 0);
          const isLast = i === items.length - 1 && !hasPending;
          return (
            <li key={item.key} className="grid grid-cols-[1fr_auto_1fr] gap-3 pb-5">
              <div className={`min-w-0 self-start ${labelLeft ? 'text-right text-label text-ink3' : 'text-body'}`}>
                {labelLeft ? item.label : item.children}
              </div>
              <span
                aria-hidden="true"
                className={`relative mt-1.5 block size-2.5 shrink-0 rounded-pill ${item.color ? '' : 'bg-accent'} ${isLast ? '' : RAIL_LINE}`}
                style={item.color ? { background: item.color } : undefined}
              />
              <div className={`min-w-0 self-start ${labelLeft ? 'text-body' : 'text-label text-ink3'}`}>
                {labelLeft ? item.children : item.label}
              </div>
            </li>
          );
        })}
        {hasPending && (
          <li className="grid grid-cols-[1fr_auto_1fr] gap-3">
            <div className={`min-w-0 self-start ${items.length % 2 === 0 ? 'text-right text-label text-ink3' : 'text-body text-ink3'}`}>
              {items.length % 2 === 0 ? undefined : pending}
            </div>
            <span aria-hidden="true" className={`relative mt-1.5 block size-2.5 shrink-0 rounded-pill border-2 border-line bg-s2 ${RAIL_LINE}`} />
            <div className={`min-w-0 self-start ${items.length % 2 === 0 ? 'text-body text-ink3' : 'text-label text-ink3'}`}>
              {items.length % 2 === 0 ? pending : undefined}
            </div>
          </li>
        )}
      </ol>
    );
  }

  return (
    <ol className={`m-0 list-none p-0${className ? ` ${className}` : ''}`}>
      {items.map((item, i) => (
        <li key={item.key} style={{ animationDelay: (i * 24) + 'ms' }} className={`animate-[bp-fade-in_var(--motion-base)_var(--ease-smooth)_both] relative flex gap-3 pb-5 ${i < items.length - 1 || hasPending ? 'before:absolute before:left-[5px] before:top-4 before:h-full before:w-px before:bg-line before:content-[""]' : ''}`}>
          <span
            aria-hidden="true"
            className={`mt-1.5 size-2.5 shrink-0 rounded-pill ${item.color ? '' : 'bg-accent'}`}
            style={item.color ? { background: item.color } : undefined}
          />
          <div className="min-w-0 flex-1">
            {item.children}
            {item.label && <span className="block text-label text-ink3">{item.label}</span>}
          </div>
        </li>
      ))}
      {hasPending && (
        <li className="relative flex gap-3">
          <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-pill border-2 border-line bg-s2" />
          <div className="min-w-0 flex-1 text-ink3">{pending}</div>
        </li>
      )}
    </ol>
  );
}
