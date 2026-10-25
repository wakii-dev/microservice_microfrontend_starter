// Radio + Radio.Group — tròn 16px, checked = dot accent; Group options layout
// horizontal mặc định (antd RadioGroup).
// A11y (sweep 2026-10-18): Group bắn chung `name` (useId) cho input radio →
// ←↑/→↑ di chuyển giữa options như native (roving selection); group nhận
// aria-label passthrough (role=radiogroup cần accessible name).
import { useId, type ReactNode } from 'react';

export interface RadioProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** name chung của group — Group tự sinh; truyền tay chỉ dùng khi Radio đơn lẻ. */
  name?: string;
  children?: ReactNode;
  className?: string;
}

export function Radio({ checked = false, onChange, disabled = false, name, children, className }: RadioProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-body text-ink${disabled ? ' cursor-not-allowed text-ink3' : ''}${className ? ` ${className}` : ''}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer size-4 cursor-pointer appearance-none rounded-pill border border-line bg-s2 shadow-[var(--ele-1)] transition-[border-color,border-width,box-shadow,transform] duration-200 ease-[var(--ease-smooth)] hover:border-ink/20 checked:border-[5px] checked:border-accent checked:scale-[1.1] checked:shadow-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-s3 disabled:shadow-none"
      />
      {children}
    </label>
  );
}

export interface RadioGroupProps {
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ label: ReactNode; value: string; disabled?: boolean }>;
  disabled?: boolean;
  /** Accessible name cho role="radiogroup". */
  'aria-label'?: string;
  className?: string;
}

export function RadioGroup({ value, onChange, options, disabled = false, className, ...rest }: RadioGroupProps) {
  // Tên chung cho cả nhóm input — bật điều hướng arrow-key native giữa options.
  const name = useId();
  return (
    <div role="radiogroup" className={`flex flex-wrap items-center gap-4${className ? ` ${className}` : ''}`} {...rest}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          checked={value === option.value}
          disabled={disabled || option.disabled}
          onChange={(checked) => checked && onChange?.(option.value)}
        >
          {option.label}
        </Radio>
      ))}
    </div>
  );
}
