// Checkbox — antd look: 16×16 radius 4, checked = nền accent + tick trắng; label
// children bọc <label> (click cả chữ); disabled.
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Checkbox({ checked = false, onChange, disabled = false, children, className, ...rest }: CheckboxProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-body text-ink${disabled ? ' cursor-not-allowed text-ink3' : ''}${className ? ` ${className}` : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        {...rest}
        className="peer size-4 cursor-pointer appearance-none rounded-[4px] border border-line bg-s2 transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] checked:border-accent checked:bg-accent checked:scale-[1.15] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-s3 disabled:checked:bg-ink3 disabled:checked:scale-100"
      />
      <span
        aria-hidden="true"
        className="-ml-5 hidden size-4 place-items-center text-[10px] font-bold text-white peer-checked:grid peer-checked:animate-[bp-check-pop_160ms_cubic-bezier(0.34,1.56,0.64,1)]"
      >
        ✓
      </span>
      {children}
    </label>
  );
}
