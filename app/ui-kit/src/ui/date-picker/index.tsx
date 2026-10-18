// DatePicker — Calendar + trigger input (popup panel). Motion: fade+zoom khi mở.
// Batch ⑧ worker C: + range mode (2 input from/to, click start → end, hover
// preview highlight khoảng như antd RangePicker) + showTime (cột TimeSpinner
// bên phải panel, xác nhận bằng OK — antd style) + locale (vi/en) + now inject.
// Single mode GIỮ NGUYÊN behavior cũ: click ngày → onChange + đóng panel.
import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from '../calendar/index.js';
import { TimeSpinner, type TimeParts } from '../time-picker/index.js';
import { useDateLocale, type DateLocaleInput } from './locale.js';
import { Icon } from '../icons/index.js';

export interface DatePickerBaseProps {
  placeholder?: string;
  disabled?: boolean;
  /** Node hiển thị trước input (icon). */
  prefix?: ReactNode;
  /** Chọn giờ phụ bên phải panel — panel mở đến khi nhấn OK. */
  showTime?: boolean;
  /** 'vi' | 'en' | DateLocale — thắng DateLocaleProvider context; default vi. */
  locale?: DateLocaleInput;
  /** Mốc "hôm nay" — inject được để test deterministic. */
  now?: Date;
  className?: string;
}

export interface DatePickerSingleProps extends DatePickerBaseProps {
  range?: false;
  value?: Date;
  onChange?: (date: Date) => void;
}

export interface DatePickerRangeProps extends DatePickerBaseProps {
  /** Range mode — 2 input from/to + panel chọn khoảng. */
  range: true;
  value?: [Date, Date];
  onChange?: (range: [Date, Date]) => void;
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

const pad = (n: number) => n.toString().padStart(2, '0');
const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

function parseTime(value: Date | [Date, Date] | undefined): TimeParts {
  const first = Array.isArray(value) ? value[0] : value;
  return first ? { h: first.getHours(), m: first.getMinutes() } : { h: 0, m: 0 };
}

export function DatePicker(props: DatePickerProps) {
  const {
    range = false,
    showTime = false,
    placeholder,
    disabled = false,
    prefix,
    className,
    locale,
    now = new Date(),
  } = props;
  const value = props.value;
  const onChange = props.onChange as ((v: Date | [Date, Date]) => void) | undefined;
  const loc = useDateLocale(locale);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Range draft — sync từ value mỗi lần mở panel (antd: mở lại = chọn lại)
  const [draft, setDraft] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [phase, setPhase] = useState<'from' | 'to'>('from');
  const [hover, setHover] = useState<Date | null>(null);
  // Single + showTime: ngày đang pick (date-part) để compose với time spinner
  const [picked, setPicked] = useState<Date | null>(null);
  const [time, setTime] = useState<TimeParts>({ h: 0, m: 0 });

  const openPanel = () => {
    if (disabled) return;
    if (range) {
      const [s, e] = Array.isArray(value) ? value : [undefined, undefined];
      setDraft({ start: s ?? null, end: e ?? null });
      setPhase('from');
    } else {
      setPicked(!Array.isArray(value) && value ? value : null);
    }
    setTime(parseTime(value));
    setHover(null);
    setOpen(true);
  };

  /** Gộp date-part với time draft khi showTime. */
  const compose = (d: Date, t: TimeParts = time): Date =>
    showTime ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.h, t.m) : d;

  const handleDay = (d: Date) => {
    if (range) {
      if (phase === 'from' || (draft.start && draft.end)) {
        setDraft({ start: d, end: null });
        setPhase('to');
        return;
      }
      const start = draft.start as Date;
      const [s, e] = d >= start ? [start, d] : [d, start];
      setDraft({ start: s, end: e });
      setPhase('from');
      onChange?.([compose(s), compose(e)] as [Date, Date]);
      if (!showTime) setOpen(false);
    } else {
      setPicked(d);
      onChange?.(compose(d));
      if (!showTime) setOpen(false); // behavior cũ: single không showTime → click là đóng
    }
  };

  const handleTime = (t: TimeParts) => {
    setTime(t);
    if (range) {
      if (draft.start && draft.end) onChange?.([compose(draft.start, t), compose(draft.end, t)] as [Date, Date]);
    } else if (picked) {
      onChange?.(compose(picked, t));
    }
  };

  const handleToday = () => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range) onChange?.([compose(today), compose(today)] as [Date, Date]);
    else onChange?.(compose(today));
    setOpen(false);
  };

  const handleOk = () => {
    if (range && draft.start && draft.end) {
      onChange?.([compose(draft.start), compose(draft.end)] as [Date, Date]);
    }
    setOpen(false);
  };

  const displayTime = () => (showTime ? ` ${pad(time.h)}:${pad(time.m)}` : '');

  // ── Trigger ──────────────────────────────────────────────────────────────
  // Single: 1 field button (behavior cũ). Range: wrapper viền + 2 nửa from/to.
  const triggerCls = `inline-flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border bg-s2 px-3 text-body transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none ${
    open ? 'border-accent-hi' : 'border-line hover:border-accent'
  } ${disabled ? 'cursor-not-allowed bg-s3 text-ink4' : 'text-ink'}`;

  let trigger: ReactNode;
  if (range) {
    const [from, to] = Array.isArray(value) ? value : [undefined, undefined];
    trigger = (
      <span className={triggerCls}>
        {prefix}
        <button
          type="button"
          aria-label={loc.rangeFrom}
          disabled={disabled}
          onClick={openPanel}
          className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left text-inherit"
        >
          <span className={from ? '' : 'text-ink'}>{from ? `${fmt(from)}${displayTime()}` : placeholder ?? loc.rangeFrom}</span>
        </button>
        <span aria-hidden="true" className="text-ink3"><Icon name="arrow-right" size={12} /></span>
        <button
          type="button"
          aria-label={loc.rangeTo}
          disabled={disabled}
          onClick={openPanel}
          className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left text-inherit"
        >
          <span className={to ? '' : 'text-ink'}>{to ? `${fmt(to)}${displayTime()}` : placeholder ?? loc.rangeTo}</span>
        </button>
        <span aria-hidden="true" className="ml-auto shrink-0 text-ink3"><Icon name="calendar" size={14} /></span>
      </span>
    );
  } else {
    const single = !Array.isArray(value) ? value : undefined;
    trigger = (
      <span className={triggerCls}>
        {prefix}
        <button
          type="button"
          aria-label={single ? `${loc.dateValuePrefix} ${fmt(single)}` : loc.triggerLabel}
          disabled={disabled}
          onClick={openPanel}
          className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left text-inherit"
        >
          <span className={single ? 'tabular-nums' : 'text-ink'}>
            {single ? `${fmt(single)}${displayTime()}` : placeholder ?? loc.placeholder}
          </span>
        </button>
        <span aria-hidden="true" className="ml-auto shrink-0 text-ink3"><Icon name="calendar" size={14} /></span>
      </span>
    );
  }

  return (
    <span ref={ref} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      {trigger}
      {open && createPortal(
        <div className="fixed inset-0 z-[var(--z-popover)]" onClick={() => setOpen(false)}>
          <div
            className="absolute animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)]"
            style={{ left: ref.current?.getBoundingClientRect().left ?? 0, top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-[300px] rounded-xl border border-line bg-s2 shadow-[var(--shadow-pop)]">
              <div className={showTime ? 'flex items-start gap-3' : ''}>
                <Calendar
                  now={now}
                  locale={locale}
                  bare
                  value={range ? (draft.start ?? undefined) : picked ?? undefined}
                  onChange={handleDay}
                  onDayHover={range && phase === 'to' ? (d) => setHover(d) : undefined}
                  range={
                    range
                      ? { start: draft.start, end: draft.end, hover: phase === 'to' ? hover : null }
                      : undefined
                  }
                />
                {showTime && (
                  <div className="w-[150px] border-l border-line2 pl-3 pt-9">
                    <TimeSpinner value={time} onChange={handleTime} locale={locale} />
                  </div>
                )}
              </div>
              {/* Footer — Hôm nay luôn có; OK chỉ khi showTime (antd: confirm đóng panel) */}
              <div className="flex items-center justify-end gap-2 border-t border-line2 px-4 py-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-label text-accent transition-colors hover:bg-accent/10"
                >
                  {loc.today}
                </button>
                {showTime && (
                  <button
                    type="button"
                    onClick={handleOk}
                    className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-label font-medium text-white transition-opacity hover:opacity-90"
                  >
                    {loc.ok}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </span>
  );
}
