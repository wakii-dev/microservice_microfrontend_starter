// Listbox — inline list (không dropdown — Select không popup).
import type { ReactNode } from 'react';

export interface ListboxOption { label: ReactNode; value: string; disabled?: boolean }

export interface ListboxProps {
  options: ListboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Listbox({ options, value, onChange, className }: ListboxProps) {
  return (
    <ul role="listbox" aria-label="Danh sách lựa chọn" className={`m-0 list-none overflow-hidden rounded-xl border border-line bg-s2 [background-image:var(--wash)] shadow-[var(--ele-1)] p-1${className ? ` ${className}` : ''}`}>
      {options.map((option) => (
        <li key={option.value} role="option" aria-selected={value === option.value}
          onClick={() => !option.disabled && onChange?.(option.value)}
          className={`flex cursor-pointer items-center rounded-2 px-3 py-1.5 text-body transition-colors ${
            value === option.value ? 'bg-accent/10 font-semibold text-accent' : 'text-ink hover:bg-s3'
          } ${option.disabled ? 'cursor-not-allowed text-ink3' : ''}`}>
          {option.label}
        </li>
      ))}
    </ul>
  );
}
