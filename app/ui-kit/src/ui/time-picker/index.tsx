// TimePicker (batch ⑧ worker C) — input giờ HH:mm + dropdown panel: stepper
// tăng/giảm từng trường (Giờ/Phút) + nút nhanh "Bây giờ". Value nhận Date|string
// ('HH:mm'); onChange luôn phát Date — GIỮ phần ngày khi input là Date, ngày
// 1970-01-01 khi input là string (time thuần). Panel portal giống DatePicker.
// Design: trigger theo pattern Input (border-line, focus accent, rounded-2 h-8),
// panel bg-s2 border shadow-pop, nút nhanh active bg-accent text-white.
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDateLocale, type DateLocaleInput } from '../date-picker/locale.js';

export interface TimeParts {
  h: number;
  m: number;
}

export interface TimeSpinnerProps {
  value: TimeParts;
  onChange: (t: TimeParts) => void;
  /** 'vi' | 'en' | DateLocale — thắng DateLocaleProvider context; default vi. */
  locale?: DateLocaleInput;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const STEP_BTN =
  'grid size-5 cursor-pointer place-items-center rounded-1 border border-line bg-transparent text-meta text-ink3 transition-colors hover:border-accent hover:text-accent';

/** Nhóm stepper Giờ/Phút dùng chung cho TimePicker panel + cột showTime của DatePicker. */
export function TimeSpinner({ value, onChange, locale }: TimeSpinnerProps) {
  const loc = useDateLocale(locale);
  const set = (part: 'h' | 'm', delta: number) => {
    if (part === 'h') onChange({ ...value, h: (value.h + delta + 24) % 24 });
    else onChange({ ...value, m: (value.m + delta + 60) % 60 });
  };
  const row = (part: 'h' | 'm', label: string, val: number) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-meta text-ink3">{label}</span>
      <span className="flex items-center gap-1.5">
        <button type="button" aria-label={`${loc.decrease} ${label.toLowerCase()}`} className={STEP_BTN}
          onClick={() => set(part, -1)}>−</button>
        <span aria-label={label} className="min-w-[2.5rem] text-center text-body font-medium text-ink tabular-nums">
          {pad(val)}
        </span>
        <button type="button" aria-label={`${loc.increase} ${label.toLowerCase()}`} className={STEP_BTN}
          onClick={() => set(part, 1)}>+</button>
      </span>
    </div>
  );
  return (
    <div className="grid gap-2">
      {row('h', loc.hour, value.h)}
      {row('m', loc.minute, value.m)}
    </div>
  );
}

export interface TimePickerProps {
  /** Date (giữ phần ngày khi phát onChange) hoặc string 'HH:mm'. */
  value?: Date | string;
  onChange?: (time: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  locale?: DateLocaleInput;
  /** Mốc "bây giờ" — inject được để test deterministic. */
  now?: Date;
  className?: string;
}

function parseValue(value: Date | string | undefined): TimeParts {
  if (value instanceof Date) return { h: value.getHours(), m: value.getMinutes() };
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? '');
  return match ? { h: Number(match[1]), m: Number(match[2]) } : { h: 0, m: 0 };
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'HH:mm',
  disabled = false,
  locale,
  now = new Date(),
  className,
}: TimePickerProps) {
  const loc = useDateLocale(locale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const parts = parseValue(value);

  // emit — giữ hành vi date-part của value gốc cho stepper + nút Now
  const emit = (t: TimeParts): Date => {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate(), t.h, t.m);
    return new Date(1970, 0, 1, t.h, t.m);
  };

  const ariaLabel = value !== undefined ? `${loc.timeValuePrefix} ${pad(parts.h)}:${pad(parts.m)}` : loc.timeTriggerLabel;

  return (
    <span ref={ref} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-8 w-full min-w-[100px] cursor-pointer items-center gap-2 rounded-2 border bg-s2 px-3 text-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
          open ? 'border-accent-hi' : 'border-line hover:border-accent'
        } ${disabled ? 'cursor-not-allowed bg-[rgba(0,0,0,0.04)] text-ink4' : 'text-ink'}`}
      >
        <span className={value !== undefined ? 'tabular-nums' : 'text-ink4'}>{value !== undefined ? `${pad(parts.h)}:${pad(parts.m)}` : placeholder}</span>
        <span aria-hidden="true" className="ml-auto text-ink3">🕐</span>
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div
            className="absolute w-[180px] animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)] rounded-xl border border-line bg-s2 p-3 shadow-[var(--shadow-pop)]"
            style={{ left: ref.current?.getBoundingClientRect().left ?? 0, top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <TimeSpinner value={parts} onChange={(t) => onChange?.(emit(t))} locale={locale} />
            <button
              type="button"
              onClick={() => {
                // "Bây giờ" = thời điểm đầy đủ (ngày + giờ của now) — không bám date-part của value
                onChange?.(new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()));
                setOpen(false);
              }}
              className="mt-3 w-full cursor-pointer rounded-lg bg-accent px-2 py-1.5 text-label font-medium text-white transition-opacity hover:opacity-90"
            >
              {loc.now}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
