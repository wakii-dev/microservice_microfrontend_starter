// Timeline — activity feed vertical (antd lite): dot + content + time, rail dọc.
import type { ReactNode } from 'react';

export interface TimelineItem {
  key: string;
  /** Dot màu (var(--accent), var(--st-done)…) hoặc children tuỳ ý. */
  color?: string;
  children: ReactNode;
  /** Label bên phải (time). */
  label?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={`m-0 list-none p-0${className ? ` ${className}` : ''}`}>
      {items.map((item, i) => (
        <li key={item.key} className={`relative flex gap-3 pb-5 ${i < items.length - 1 ? 'before:absolute before:left-[5px] before:top-4 before:h-full before:w-px before:bg-line before:content-[""]' : ''}`}>
          <span
            aria-hidden="true"
            className={`mt-1.5 size-2.5 shrink-0 rounded-pill ${item.color ? '' : 'bg-accent'}`}
            style={item.color ? { background: item.color } : undefined}
          />
          <div className="min-w-0 flex-1">
            {item.children}
            {item.label && <span className="block text-meta text-ink3">{item.label}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
