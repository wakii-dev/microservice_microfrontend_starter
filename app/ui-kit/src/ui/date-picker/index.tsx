// DatePicker — Calendar + trigger input (popup panel). Motion: fade+zoom khi mở.
import { useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from '../calendar/index';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Node hiển thị trước input (icon). */
  prefix?: ReactNode;
  className?: string;
}

const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

export function DatePicker({ value, onChange, placeholder = 'Chọn ngày…', disabled = false, prefix, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  return (
    <span ref={ref} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        aria-label={typeof value === 'object' && value ? `Ngày: ${fmt(value)}` : 'Chọn ngày'}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-8 w-full min-w-[140px] cursor-pointer items-center gap-2 rounded-2 border bg-s2 px-3 text-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
          open ? 'border-accent-hi' : 'border-line hover:border-accent'
        } ${disabled ? 'cursor-not-allowed bg-[rgba(0,0,0,0.04)] text-ink4' : 'text-ink'}`}
      >
        {prefix}
        <span className={value ? '' : 'text-ink4'}>{value ? fmt(value) : placeholder}</span>
        <span aria-hidden="true" className="ml-auto text-ink3">📅</span>
      </button>
      {open && createPortal(
        <div ref={popRef} className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div
            className="absolute mt-1 animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)]"
            style={{ left: ref.current?.getBoundingClientRect().left ?? 0, top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar value={value} onChange={(d) => { onChange?.(d); setOpen(false); }} />
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
