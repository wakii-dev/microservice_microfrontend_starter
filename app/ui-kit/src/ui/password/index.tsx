// Password — Input password + toggle hiện/ẩn + strength meter.
import { useState } from 'react';
import { Input } from '../input/index';

export interface PasswordProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

function strength(v: string): 0 | 1 | 2 | 3 {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9!@#$%^&*()]/.test(v)) s++;
  return Math.min(3, s) as 0 | 1 | 2 | 3;
}

const STRENGTH_LABEL = ['', 'Yếu', 'Trung bình', 'Mạnh'];
const STRENGTH_COLOR = ['', 'bg-st-fail', 'bg-st-doing', 'bg-st-done'];

export function Password({ value: valueProp, onChange, placeholder, showStrength, disabled, ariaLabel = 'Mật khẩu', className }: PasswordProps) {
  const [visible, setVisible] = useState(false);
  const [internal, setInternal] = useState('');
  const value = valueProp ?? internal;
  const level = strength(value);

  return (
    <div className={className}>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onChange={(e) => {
            setInternal(e.target.value);
            onChange?.(e.target.value);
          }}
        />
        <button
          type="button"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent text-label text-ink3"
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-pill ${i <= level ? STRENGTH_COLOR[level] : 'bg-line2'}`} />
          ))}
          <span className="ml-1 text-meta text-ink3">{STRENGTH_LABEL[level]}</span>
        </div>
      )}
    </div>
  );
}
