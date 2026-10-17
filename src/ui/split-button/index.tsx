// SplitButton — primary action + dropdown secondary actions (antd Dropdown.Button).
import { useState } from 'react';
import { Button } from '../button/index';
import type { ButtonType } from '../button/index';

export interface SplitButtonItem { key: string; label: string; danger?: boolean }

export interface SplitButtonProps {
  /** Nhãn action chính. */
  label: string;
  type?: ButtonType;
  danger?: boolean;
  items: SplitButtonItem[];
  onClick?: () => void;
  onItemClick?: (key: string) => void;
  className?: string;
}

export function SplitButton({ label, type = 'primary', danger, items, onClick, onItemClick, className }: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <Button type={type} danger={danger} className="rounded-r-none" onClick={onClick}>{label}</Button>
      <Button
        type={type}
        danger={danger}
        aria-label="Thêm tuỳ chọn"
        aria-expanded={open}
        className="-ml-px rounded-l-none px-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        ▾
      </Button>
      {open && (
        <ul className="absolute left-0 top-full z-30 m-0 mt-1 min-w-[140px] list-none rounded-3 border border-line bg-s2 p-1 shadow-[var(--shadow-pop)]">
          {items.map((item) => (
            <li key={item.key}>
              <button type="button"
                onClick={() => { onItemClick?.(item.key); setOpen(false); }}
                className={`w-full cursor-pointer rounded-2 border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors ${
                  item.danger ? 'text-st-fail hover:bg-st-fail/12' : 'text-ink hover:bg-s3'
                }`}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
