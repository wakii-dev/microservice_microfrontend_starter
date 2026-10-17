// Select — single select có keyboard (antd look): trigger h-32 + dropdown panel
// (radius 8, shadow popover, option h-8 px-3, hover fill-quaternary, selected =
// colorPrimaryBg #e6f4ff + font-semibold). aria: button[haspopup=listbox] +
// listbox/option (a11y đầy đủ hơn antd select giao diện web).
import { useId, useRef, useState, type KeyboardEvent } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** GIỮ NGUYÊN cho contract a11y (vd "Trạng thái task <title>") — aria-label trigger. */
  ariaLabel: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({ ariaLabel, value, onChange, options, placeholder, disabled = false, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const activeOption = options[active];

  function commit(option: SelectOption) {
    if (option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) {
          if (activeOption) commit(activeOption);
        } else {
          setOpen(true);
          setActive(Math.max(0, options.findIndex((o) => o.value === value)));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(0);
        } else setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) setActive((i) => Math.max(0, i - 1));
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  }

  return (
    <span className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : (setOpen(true), setActive(Math.max(0, options.findIndex((o) => o.value === value)))))}
        onKeyDown={onKeyDown}
        className={`inline-flex h-8 w-full min-w-[120px] cursor-pointer items-center justify-between gap-1 rounded-2 border bg-s2 px-3 text-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
          open ? 'border-accent' : 'border-line hover:border-accent'
        } ${disabled ? 'cursor-not-allowed bg-s3 text-ink3' : 'text-ink'}`}
      >
        <span className={selected ? '' : 'text-ink3'}>{selected?.label ?? placeholder ?? 'Chọn…'}</span>
        <span aria-hidden="true" className={`text-ink3 transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-20 mt-1 max-h-60 w-full min-w-[120px] overflow-auto rounded-3 border border-line bg-s2 p-1 shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive = i === active;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                className={`flex h-8 cursor-pointer items-center rounded-2 px-3 text-body ${
                  isSelected ? 'bg-[#e6f4ff] font-semibold text-accent' : 'text-ink hover:bg-s3'
                } ${isActive ? 'outline-1 -outline-offset-1 outline-accent/40' : ''} ${option.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(option)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}
