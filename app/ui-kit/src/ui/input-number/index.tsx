// InputNumber — input số + stepper ▲▼ (antd: handlers phải, min/max/step, precision
// handle ở consumer). Out-of-range clamp khi blur.
import { useState, type FocusEvent } from 'react';

export interface InputNumberProps {
  value?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function InputNumber({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled = false,
  invalid = false,
  ariaLabel,
  className,
}: InputNumberProps) {
  const [text, setText] = useState(value !== undefined ? String(value) : '');

  function commit(raw: string) {
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n)) {
      onChange?.(null);
      return;
    }
    onChange?.(Math.min(max, Math.max(min, n)));
  }

  function bump(delta: number) {
    const base = Number(text) || 0;
    const next = Math.min(max, Math.max(min, base + delta));
    setText(String(next));
    onChange?.(next);
  }

  function onBlur(e: FocusEvent<HTMLInputElement>) {
    commit(e.target.value);
  }

  return (
    <span
      className={`inline-flex w-full items-stretch overflow-hidden rounded-2 border bg-s2 ${invalid ? 'border-st-fail' : 'border-line'}${disabled ? ' bg-s3' : ''}${className ? ` ${className}` : ''}`}
    >
      <input
        type="number"
        aria-label={ariaLabel}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={onBlur}
        className="h-8 min-w-0 flex-1 border-none bg-transparent px-3 text-body text-ink outline-none [appearance:textfield]"
      />
      <span className="flex flex-col border-l border-line">
        <button
          type="button"
          aria-label="Tăng"
          disabled={disabled}
          onClick={() => bump(step)}
          className="flex-1 cursor-pointer border-none bg-s3 px-2 text-[9px] leading-none text-ink2 transition-colors hover:text-ink"
        >
          ▲
        </button>
        <button
          type="button"
          aria-label="Giảm"
          disabled={disabled}
          onClick={() => bump(-step)}
          className="flex-1 cursor-pointer border-t border-line bg-s3 px-2 text-[9px] leading-none text-ink2 transition-colors hover:text-ink"
        >
          ▼
        </button>
      </span>
    </span>
  );
}
