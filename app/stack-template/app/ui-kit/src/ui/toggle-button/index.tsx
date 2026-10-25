// ToggleButton — button với checked state (antd-lite).
import type { ReactNode } from 'react';

export interface ToggleButtonProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Giá trị đại diện khi nằm trong `ToggleButtonGroup` (đứng lẻ: bỏ qua). */
  value?: string;
  children: ReactNode;
  className?: string;
}

export function ToggleButton({ checked = false, onChange, disabled, children, className }: ToggleButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-3 text-body transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
        checked ? 'border-accent bg-accent text-white' : 'border-line bg-s2 text-ink hover:border-accent hover:text-accent'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}
