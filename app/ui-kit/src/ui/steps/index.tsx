// Steps — tiến trình (antd lite horizontal): done = chấm accent + tick, current =
// viền accent + chữ accent, waiting = ink3; connector line giữa các step.
import type { ReactNode } from 'react';

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
}

export interface StepsProps {
  items: StepItem[];
  /** Index step hiện tại — < i là done, === i là current, > i là waiting. */
  current: number;
  className?: string;
}

export function Steps({ items, current, className }: StepsProps) {
  return (
    <ol className={`m-0 flex list-none gap-0 p-0${className ? ` ${className}` : ''}`}>
      {items.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'waiting';
        const dot =
          state === 'done' ? (
            <span className="grid size-7 place-items-center rounded-pill border border-accent bg-accent text-[11px] font-bold text-white">
              ✓
            </span>
          ) : state === 'current' ? (
            <span className="grid size-7 place-items-center rounded-pill border-2 border-accent text-[11px] font-bold text-accent">
              {i + 1}
            </span>
          ) : (
            <span className="grid size-7 place-items-center rounded-pill border border-line text-[11px] font-bold text-ink3">
              {i + 1}
            </span>
          );
        const titleColor = state === 'waiting' ? 'text-ink3' : state === 'current' ? 'text-accent' : 'text-ink';
        return (
          <li key={i} className={`flex flex-1 items-start gap-2 ${i < items.length - 1 ? 'after:mx-3 after:mt-3.5 after:h-px after:flex-1 after:bg-line2 after:content-[""]' : ''}`}>
            {dot}
            <div className="flex flex-col">
              <span className={`text-body font-medium ${titleColor}`}>{step.title}</span>
              {step.description && <span className="text-meta text-ink3">{step.description}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
