// Rating — stars + hover preview + readonly (antd look).
import { useState } from 'react';

export interface RatingProps {
  value?: number;
  onChange?: (v: number) => void;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function Rating({ value = 0, onChange, max = 5, disabled, readOnly, className }: RatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className={`inline-flex gap-0.5${className ? ` ${className}` : ''}`} role="radiogroup" aria-label="Đánh giá">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || readOnly}
          aria-label={`${star} sao`}
          onMouseEnter={() => !disabled && !readOnly && setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => !disabled && !readOnly && onChange?.(star)}
          className={`cursor-pointer border-none bg-transparent p-0 text-lg leading-none transition-colors ${
            star <= display ? 'text-st-doing' : 'text-line'
          } ${disabled || readOnly ? 'cursor-default' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
