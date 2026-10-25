// Checkbox — antd look: 16×16 radius 4, checked = nền accent + tick SVG (Icon
// 'check' — user feedback 2026-10-23: ký tự ✓ text mảnh tùy font, không đẹp); label
// children bọc <label> (click cả chữ); disabled.
// Tri-state (PrimeReact triStateCheckbox parity): checked = boolean | null —
// null = indeterminate (nền accent + dash —, aria-checked="mixed"); prop
// `indeterminate` override kiểu antd. Parent điều khiển cycle true → null → false.
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'checked' | 'onChange'> {
  /** true / false / null (null = indeterminate — dash + aria-checked mixed). */
  checked?: boolean | null;
  onChange?: (checked: boolean) => void;
  /** Override indeterminate kiểu antd (đè lên checked === null). */
  indeterminate?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Checkbox({ checked = false, indeterminate = false, onChange, disabled = false, children, className, ...rest }: CheckboxProps) {
  const tri = indeterminate || checked === null;
  const inputChecked = checked === true;
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-body text-ink${disabled ? ' cursor-not-allowed text-ink3' : ''}${className ? ` ${className}` : ''}`}>
      <input
        type="checkbox"
        checked={inputChecked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        aria-checked={tri ? 'mixed' : inputChecked}
        {...rest}
        className={`peer size-4 cursor-pointer appearance-none rounded-[4px] border border-line bg-s2 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-smooth)] hover:border-ink/20 checked:border-accent checked:bg-accent checked:scale-[1.15] checked:shadow-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-s3 disabled:shadow-none disabled:checked:bg-ink3 disabled:checked:scale-100 ${tri ? 'border-accent bg-accent shadow-none' : ''}`}
      />
      {/* tick — chỉ khi checked thật (không hiện khi indeterminate) */}
      <span
        aria-hidden="true"
        className={`-ml-5 hidden size-4 place-items-center text-[10px] font-bold text-white ${inputChecked && !tri ? 'grid peer-checked:grid peer-checked:animate-[bp-check-pop_160ms_cubic-bezier(0.34,1.56,0.64,1)]' : ''}`}
      >
        <Icon name="check" size={12} />
      </span>
      {/* dash indeterminate — nền accent, không animation pop */}
      <span
        aria-hidden="true"
        className={`-ml-5 size-4 items-center justify-center text-[10px] font-bold leading-none text-white ${tri ? 'grid' : 'hidden'}`}
      >
        <span className="h-0.5 w-2 rounded-[1px] bg-white" />
      </span>
      {children}
    </label>
  );
}
