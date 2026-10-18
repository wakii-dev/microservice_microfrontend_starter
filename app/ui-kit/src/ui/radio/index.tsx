// Radio + Radio.Group — tròn 16px, checked = dot accent; Group options layout
// horizontal mặc định (antd RadioGroup).
import type { ReactNode } from 'react';

export interface RadioProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Radio({ checked = false, onChange, disabled = false, children, className }: RadioProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-body text-ink${disabled ? ' cursor-not-allowed text-ink3' : ''}${className ? ` ${className}` : ''}`}>
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer size-4 cursor-pointer appearance-none rounded-pill border border-line bg-s2 transition-[border-color,border-width,transform] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] checked:border-[5px] checked:border-accent checked:scale-[1.1] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-s3"
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
  className?: string;
}

export function RadioGroup({ value, onChange, options, disabled = false, className }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={`flex flex-wrap items-center gap-4${className ? ` ${className}` : ''}`}>
      {options.map((option) => (
        <Radio
          key={option.value}
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
