// InputMask — pattern matching lite (9=số, a=chữ, *=alnum; ký tự khác = literal).
import { useState, type InputHTMLAttributes } from 'react';

export interface InputMaskProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  mask: string;
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

function applyMask(raw: string, mask: string): string {
  let result = ''; let rawIdx = 0;
  for (const m of mask) {
    if (rawIdx >= raw.length) break;
    if (m === '9') { if (/\d/.test(raw[rawIdx])) { result += raw[rawIdx]; rawIdx++; } else break; }
    else if (m === 'a') { if (/[a-zA-Z]/.test(raw[rawIdx])) { result += raw[rawIdx]; rawIdx++; } else break; }
    else if (m === '*') { result += raw[rawIdx]; rawIdx++; }
    else { result += m; if (raw[rawIdx] === m) rawIdx++; }
  }
  return result;
}

export function InputMask({ mask, value: valueProp, onChange, ariaLabel, className, ...rest }: InputMaskProps) {
  const [internal, setInternal] = useState('');
  const value = valueProp ?? internal;
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => {
        const masked = applyMask(e.target.value, mask);
        setInternal(masked); onChange?.(masked);
      }}
      className={`h-8 w-full rounded-lg border border-line bg-s3 px-3 text-body text-ink placeholder:text-ink4 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus:border-accent-hi focus:bg-s1 focus:shadow-[var(--ele-2)] focus:ring-[3px] focus:ring-accent/40 focus:outline-none${className ? ` ${className}` : ''}`}
      {...rest}
    />
  );
}
