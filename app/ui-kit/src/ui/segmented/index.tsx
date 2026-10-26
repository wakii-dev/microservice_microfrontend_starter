// Segmented — dãy tuỳ chọn thumb-chọn (antd: container #f5f5f5 radius 8 p-1,
// item active = container trắng radius 6 shadow nhỏ).
// slots-wave: classNames root/item + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface SegmentedClassNames {
  /** Div radiogroup gốc. */
  root?: string;
  /** Button radio mỗi tuỳ chọn (áp cả active/disabled). */
  item?: string;
}

export interface SegmentedProps {
  /** Các tuỳ chọn — value phải khả định duy nhất; disabled → không bấm được. */
  options: Array<{ label: ReactNode; value: string; disabled?: boolean }>;
  /** Tuỳ chọn đang chọn (controlled). */
  value?: string;
  /** Callback khi chọn tuỳ chọn khác. */
  onChange?: (value: string) => void;
  /** Nhãn a11y cho radiogroup (aria-label). */
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: SegmentedClassNames;
}

export function Segmented(props: SegmentedProps) {
  const { options, value, onChange, ariaLabel, className, style } = props;
  const slots = props.classNames;
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={classNames('inline-flex items-center gap-1 rounded-lg bg-s3 p-1', slots?.root, className)}
      style={style}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const isDisabled = option.disabled === true;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange?.(option.value)}
            className={classNames(
              'rounded-lg border-none px-3 py-1 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              isDisabled
                ? 'cursor-not-allowed text-ink4'
                : `cursor-pointer active:opacity-70 ${isActive ? 'bg-s2 text-ink shadow-sm' : 'bg-transparent text-ink2 hover:text-ink'}`,
              slots?.item,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
