// Segmented — dãy tuỳ chọn thumb-chọn (antd: container #f5f5f5 radius 8 p-1,
// item active = container trắng radius 6 shadow nhỏ).
import type { ReactNode } from 'react';

export interface SegmentedProps {
  /** Các tuỳ chọn — value phải khả định duy nhất. */
  options: Array<{ label: ReactNode; value: string }>;
  /** Tuỳ chọn đang chọn (controlled). */
  value?: string;
  /** Callback khi chọn tuỳ chọn khác. */
  onChange?: (value: string) => void;
  className?: string;
}

export function Segmented({ options, value, onChange, className }: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center gap-1 rounded-lg bg-s3 p-1${className ? ` ${className}` : ''}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange?.(option.value)}
            className={`cursor-pointer rounded-lg border-none px-3 py-1 text-body transition-colors active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
              isActive
                ? 'bg-s2 text-ink shadow-sm'
                : 'bg-transparent text-ink2 hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
