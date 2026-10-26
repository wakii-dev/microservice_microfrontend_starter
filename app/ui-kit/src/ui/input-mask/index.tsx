// InputMask — pattern matching lite (9=số, a=chữ, *=alnum; ký tự khác = literal).
// Customize pass (slots wave 3): classNames slot root (comp 1 phần tử) — style
// đã passthrough sẵn qua InputHTMLAttributes rest; default path giữ nguyên DOM.
import classNames from 'classnames';
import { useState, type InputHTMLAttributes } from 'react';

/** Slot classes kiểu antd v5 (slots wave 3) — comp 1 phần tử → chỉ root. */
export interface InputMaskClassNames {
  /** Chính <input> — cùng element với className prop. */
  root?: string;
}

export interface InputMaskProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  mask: string;
  value?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: InputMaskClassNames;
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

export function InputMask(props: InputMaskProps) {
  const { mask, value: valueProp, onChange, ariaLabel, className, ...rest } = props;
  const slots = props.classNames;
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
      className={classNames(
        'h-8 w-full rounded-lg border border-line bg-s3 px-3 text-body text-ink placeholder:text-ink4 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus:border-accent-hi focus:bg-s1 focus:shadow-[var(--ele-2)] focus:ring-[3px] focus:ring-accent/40 focus:outline-none',
        slots?.root,
        className,
      )}
      {...rest}
    />
  );
}
