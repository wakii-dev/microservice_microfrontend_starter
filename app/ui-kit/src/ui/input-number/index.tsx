// InputNumber — PrimeReact pattern: input + stepper icon buttons XẶP DỌC trong
// mép phải (input group: input + border-left phân tách), SVG chevron up/down,
// keyboard ↑↓, min/max/step clamp, disabled.
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

function ChevronUpIcon({ className }: { className?: string }) {
  return <svg width="10" height="10" viewBox="0 0 14 14" fill="none" className={className}><path d="M3 9l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronDownIcon({ className }: { className?: string }) {
  return <svg width="10" height="10" viewBox="0 0 14 14" fill="none" className={className}><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function InputNumber({
  value, onChange, min = -Infinity, max = Infinity, step = 1,
  disabled = false, invalid = false, ariaLabel, className,
}: InputNumberProps) {
  const [text, setText] = useState(value !== undefined ? String(value) : '');

  function commit(raw: string) {
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n)) { onChange?.(null); return; }
    onChange?.(Math.min(max, Math.max(min, n)));
  }

  function bump(delta: number) {
    const base = Number(text) || 0;
    const next = Math.min(max, Math.max(min, base + delta));
    setText(String(next)); onChange?.(next);
  }

  const borderCls = invalid ? 'border-st-fail' : 'border-line focus-within:border-accent-hi';

  return (
    <span
      className={`inline-flex w-full items-stretch overflow-hidden rounded-lg border bg-s2 ${borderCls}${disabled ? ' bg-s3 opacity-60' : ''}${className ? ` ${className}` : ''}`}
    >
      <input
        type="number"
        aria-label={ariaLabel}
        value={text}
        disabled={disabled}
        onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
        onBlur={(e: FocusEvent<HTMLInputElement>) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); bump(step); }
          if (e.key === 'ArrowDown') { e.preventDefault(); bump(-step); }
        }}
        className="h-8 min-w-0 flex-1 border-none bg-transparent px-3 text-body text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className={`flex flex-col border-l ${invalid ? 'border-st-fail' : 'border-line'} ${disabled ? 'opacity-50' : ''}`}>
        <button
          type="button" aria-label="Tăng" disabled={disabled} onClick={() => bump(step)}
          className="flex h-1/2 w-7 cursor-pointer items-center justify-center border-none bg-s3 text-ink2 transition-colors hover:bg-line2 hover:text-accent active:scale-95"
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button" aria-label="Giảm" disabled={disabled} onClick={() => bump(-step)}
          className="flex h-1/2 w-7 cursor-pointer items-center justify-center border-t border-line bg-s3 text-ink2 transition-colors hover:bg-line2 hover:text-accent active:scale-95"
        >
          <ChevronDownIcon />
        </button>
      </span>
    </span>
  );
}
