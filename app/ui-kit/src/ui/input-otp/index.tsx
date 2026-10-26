// InputOTP — N ô nhập 1 ký tự + paste + auto-focus forward.
// Customize pass (slots wave 3): classNames slots (root/cell) + style
// passthrough — default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import { useRef, useState, type ClipboardEvent, type CSSProperties, type KeyboardEvent } from 'react';

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface InputOTPClassNames {
  /** Span row gốc (gap giữa các ô) — cùng element với className prop. */
  root?: string;
  /** <input> mỗi ô 1 ký tự. */
  cell?: string;
}

export interface InputOTPProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên span row gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: InputOTPClassNames;
}

export function InputOTP(props: InputOTPProps) {
  const { length = 6, value: valueProp, onChange, disabled, ariaLabel = 'Mã OTP', className, style } = props;
  const slots = props.classNames;
  const [internal, setInternal] = useState('');
  const value = valueProp ?? internal;
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setChar(index: number, char: string) {
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = char;
    const next = chars.join('').trimEnd();
    setInternal(next); onChange?.(next);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) refs.current[index - 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').slice(0, length);
    setInternal(text); onChange?.(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <span className={classNames('inline-flex gap-1.5', slots?.root, className)} style={style}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          aria-label={`${ariaLabel} ${i + 1}`}
          value={value[i] ?? ''}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onChange={(e) => setChar(i, e.target.value.replace(/\D/g, '').slice(-1))}
          className={classNames('size-10 cursor-text rounded-lg border border-line bg-s3 text-center text-h2 font-semibold text-ink tabular-nums shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus:border-accent focus:bg-s1 focus:shadow-[var(--ele-2)] focus:ring-[3px] focus:ring-accent/40 focus:outline-none disabled:cursor-not-allowed disabled:bg-s3 disabled:shadow-none', slots?.cell)}
        />
      ))}
    </span>
  );
}
