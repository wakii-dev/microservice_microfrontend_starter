// CascadeSelect — chọn có phân cấp (antd Cascader lite).
import { useState } from 'react';

export interface CascadeOption {
  label: string; value: string;
  children?: CascadeOption[];
}

export interface CascadeSelectProps {
  options: CascadeOption[];
  value?: string[];
  onChange?: (path: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function CascadeSelect({ options, value = [], onChange, placeholder = 'Chọn…', className }: CascadeSelectProps) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState(0);

  let current = options;
  for (let i = 0; i < value.length; i++) {
    const found = current.find((o) => o.value === value[i]);
    if (!found?.children) break;
    current = found.children;
  }

  return (
    <div className={`relative inline-flex w-full${className ? ` ${className}` : ''}`}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-full items-center justify-between rounded-2 border border-line bg-s2 px-3 text-body text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none">
        <span className={value.length > 0 ? '' : 'text-ink4'}>{value.length > 0 ? value.join(' / ') : placeholder}</span>
        <span className="text-ink3">▸</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 flex gap-px overflow-hidden rounded-3 border border-line bg-s2 shadow-[var(--shadow-pop)]">
          {current.map((option) => (
            <button key={option.value} type="button"
              onClick={() => {
                const next = [...value.slice(0, level), option.value];
                if (option.children) { setLevel(level + 1); onChange?.(next); }
                else { onChange?.(next); setOpen(false); setLevel(0); }
              }}
              className={`block w-full min-w-[140px] cursor-pointer px-3 py-2 text-left text-body text-ink hover:bg-s3`}>
              {option.label}
              {option.children && <span className="float-right text-ink3">›</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
