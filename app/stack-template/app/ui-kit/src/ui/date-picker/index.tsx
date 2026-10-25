// DatePicker — Calendar + trigger input (popup panel). Motion: fade+zoom khi mở.
// Batch ⑧ worker C: + range mode (2 input from/to, click start → end, hover
// preview highlight khoảng như antd RangePicker) + showTime (cột TimeSpinner
// bên phải panel, xác nhận bằng OK — antd style) + locale (vi/en) + now inject.
// Single mode GIỮ NGUYÊN behavior cũ: click ngày → onChange + đóng panel.
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  const panelRef = useRef<HTMLDivElement>(null);
  // Responsive 375 (bugfix PO): đo panel sau layout → clamp cạnh phải + flip đáy
  // theo size THẬT (fallback = min-w 300 / ~360 chiều cao calendar+footer khi chưa đo).
  const [panelW, setPanelW] = useState(0);
  const [panelH, setPanelH] = useState(0);
  useLayoutEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    // ResizeObserver: panel đổi size SAU khi mở (font load, wrap lại theo viewport,
    // scrollbar canvas) → clamp/flip phải theo size MỚI, không đo 1 lần bị stale.
    const measure = () => { setPanelW(el.offsetWidth); setPanelH(el.offsetHeight); };
    measure();
    if (typeof ResizeObserver === 'undefined') return; // jsdom — fallback min-w còn đúng
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

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
  const triggerCls = `inline-flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border bg-s3 px-3 text-body shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)] focus-visible:ring-[3px] focus-visible:ring-accent/40 focus-visible:outline-none ${
    open ? 'border-accent-hi' : 'border-line hover:border-ink/20'
  } ${disabled ? 'cursor-not-allowed bg-s3 text-ink4 shadow-none' : 'text-ink'}`;

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

  // Vị trí panel: bottom-start mặc định; clamp lề phải (margin 8) khi trigger sát
  // phải; flip lên trên khi không đủ chỗ phía dưới (không che trigger).
  const rect = ref.current?.getBoundingClientRect();
  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;
  const PANEL_W_FALLBACK = 300; // = min-w panel
  const PANEL_H_FALLBACK = 360; // ≈ calendar 6 hàng + footer
  const panelWidth = panelW || PANEL_W_FALLBACK;
  const panelHeight = panelH || PANEL_H_FALLBACK;
  const flipUp = rect != null && rect.bottom + 8 + panelHeight > vh;
  const posStyle: CSSProperties = {
    left: Math.max(8, Math.min(rect?.left ?? 0, vw - 8 - panelWidth)),
    ...(flipUp ? { bottom: vh - (rect?.top ?? 0) + 4 } : { top: (rect?.bottom ?? 0) + 4 }),
  };

  return (
    <span ref={ref} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      {trigger}
      {open && createPortal(
        <div className="fixed inset-0 z-[var(--z-popover)]" onClick={() => setOpen(false)}>
          <div
            className="absolute animate-[bp-zoom-in_var(--motion-base)_var(--ease-enter)]"
            style={posStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              ref={panelRef}
              className="min-w-[300px] max-w-[calc(100vw-16px)] rounded-xl border border-line bg-s2 bg-[image:var(--wash)] shadow-[var(--shadow-pop),var(--ele-3)]"
            >
              <div className={showTime ? 'flex flex-wrap items-start gap-3' : ''}>
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
                  <div className="min-w-0 w-[150px] border-l border-line2 pl-3 pt-9">
                    <TimeSpinner value={time} onChange={handleTime} locale={locale} />
                  </div>
                )}
              </div>
              {/* Footer — Hôm nay luôn có; OK chỉ khi showTime (antd: confirm đóng panel) */}
              <div className="flex items-center justify-end gap-2 border-t border-line2 px-4 py-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-label text-accent transition-colors duration-200 ease-[var(--ease-smooth)] hover:bg-accent/10"
                >
                  {loc.today}
                </button>
                {showTime && (
                  <button
                    type="button"
                    onClick={handleOk}
                    className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-label font-medium text-white transition-[opacity,transform] duration-200 ease-[var(--ease-smooth)] hover:opacity-90 active:translate-y-px"
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
