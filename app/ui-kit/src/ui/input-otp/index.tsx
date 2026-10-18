// InputOTP — N ô nhập 1 ký tự + paste + auto-focus forward.
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';

export interface InputOTPProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function InputOTP({ length = 6, value: valueProp, onChange, disabled, ariaLabel = 'Mã OTP', className }: InputOTPProps) {
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
    <span className={`inline-flex gap-1.5${className ? ` ${className}` : ''}`}>
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
          className="size-10 cursor-text rounded-lg border border-line bg-s2 text-center text-h2 font-semibold text-ink transition-colors focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-s3"
        />
      ))}
    </span>
  );
}
