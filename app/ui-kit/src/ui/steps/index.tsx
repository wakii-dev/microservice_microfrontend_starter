// Steps — tiến trình (antd lite horizontal): done = chấm accent + tick, current =
// viền accent + chữ accent, waiting = ink3; connector line giữa các step.
// Customize pass (slots wave 3): classNames slots (root/step/indicator/label/
// description) + style passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
}

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface StepsClassNames {
  /** <ol> gốc (nơi className prop cũng dính). */
  root?: string;
  /** <li> mỗi step (gồm connector line qua ::after). */
  step?: string;
  /** Span chấm/số (cả 3 state done/current/waiting). */
  indicator?: string;
  /** Span tiêu đề step. */
  label?: string;
  /** Span mô tả dưới tiêu đề — chỉ render khi có description. */
  description?: string;
}

export interface StepsProps {
  items: StepItem[];
  /** Index step hiện tại — < i là done, === i là current, > i là waiting. */
  current: number;
  className?: string;
  /** Inline style — passthrough lên <ol> gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: StepsClassNames;
}

export function Steps(props: StepsProps) {
  const { items, current, className, style } = props;
  const slots = props.classNames;
  return (
    <ol className={classNames('m-0 flex list-none gap-0 p-0', slots?.root, className)} style={style}>
      {items.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'waiting';
        const dot =
          state === 'done' ? (
            <span
              data-testid="step-done"
              className={classNames(
                'grid size-7 place-items-center rounded-pill border border-accent bg-accent text-[11px] font-bold text-white',
                slots?.indicator,
              )}
            >
              <Icon name="check" size={12} />
            </span>
          ) : state === 'current' ? (
            <span
              className={classNames(
                'grid size-7 place-items-center rounded-pill border-2 border-accent text-[11px] font-bold text-accent',
                slots?.indicator,
              )}
            >
              {i + 1}
            </span>
          ) : (
            <span
              className={classNames(
                'grid size-7 place-items-center rounded-pill border border-line text-[11px] font-bold text-ink3',
                slots?.indicator,
              )}
            >
              {i + 1}
            </span>
          );
        const titleColor = state === 'waiting' ? 'text-ink3' : state === 'current' ? 'text-accent' : 'text-ink';
        return (
          <li
            key={i}
            aria-current={state === 'current' ? 'step' : undefined}
            className={classNames(
              'flex flex-1 items-start gap-2',
              i < items.length - 1 ? 'after:mx-3 after:mt-3.5 after:h-px after:flex-1 after:bg-line2 after:content-[""]' : '',
              slots?.step,
            )}
          >
            {dot}
            <div className="flex flex-col">
              <span className={classNames('text-body font-medium', titleColor, slots?.label)}>{step.title}</span>
              {step.description && <span className={classNames('text-label text-ink3', slots?.description)}>{step.description}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
