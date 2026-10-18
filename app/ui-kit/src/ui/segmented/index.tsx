// Segmented — dãy tuỳ chọn thumb-chọn (antd: container #f5f5f5 radius 8 p-1,
// item active = container trắng radius 6 shadow nhỏ).
import type { ReactNode } from 'react';

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
}

export function Segmented({ options, value, onChange, ariaLabel, className }: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-lg bg-s3 p-1${className ? ` ${className}` : ''}`}
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
            className={`rounded-lg border-none px-3 py-1 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              isDisabled
                ? 'cursor-not-allowed text-ink4'
                : `cursor-pointer active:opacity-70 ${isActive ? 'bg-s2 text-ink shadow-sm' : 'bg-transparent text-ink2 hover:text-ink'}`
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
