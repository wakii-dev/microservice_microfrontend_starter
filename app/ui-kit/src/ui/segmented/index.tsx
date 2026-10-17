// Segmented — dãy tuỳ chọn thumb-chọn (antd: container #f5f5f5 radius 8 p-1,
// item active = container trắng radius 6 shadow nhỏ).
import type { ReactNode } from 'react';

export interface SegmentedProps {
  options: Array<{ label: ReactNode; value: string }>;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Segmented({ options, value, onChange, className }: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      className={`inline-flex items-center gap-1 rounded-2 bg-s3 p-1${className ? ` ${className}` : ''}`}
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
            className={`cursor-pointer rounded-2 border-none px-3 py-1 text-body transition-colors ${
              isActive
                ? 'bg-s2 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
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
