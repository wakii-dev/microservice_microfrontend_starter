// Rating — stars + hover preview + readonly (antd look).
// Customize pass (slots wave 3): classNames slots (root/star) + style
// passthrough — default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import { useState, type CSSProperties } from 'react';

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface RatingClassNames {
  /** Div radiogroup gốc — cùng element với className prop. */
  root?: string;
  /** Button mỗi sao. */
  star?: string;
}

export interface RatingProps {
  value?: number;
  onChange?: (v: number) => void;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: RatingClassNames;
}

export function Rating(props: RatingProps) {
  const { value = 0, onChange, max = 5, disabled, readOnly, className, style } = props;
  const slots = props.classNames;
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className={classNames('inline-flex gap-0.5', slots?.root, className)} style={style} role="radiogroup" aria-label="Đánh giá">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || readOnly}
          aria-label={`${star} sao`}
          onMouseEnter={() => !disabled && !readOnly && setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => !disabled && !readOnly && onChange?.(star)}
          className={classNames(
            'cursor-pointer border-none bg-transparent p-0 text-lg leading-none transition-colors',
            star <= display ? 'text-st-doing' : 'text-line',
            (disabled || readOnly) && 'cursor-default',
            slots?.star,
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
