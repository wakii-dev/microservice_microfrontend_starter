// Calendar — PrimeReact-style month view: ô VUÔNG aspect-square, MỘT radius,
// PHẲNG nền mỗi state (không gradient/shadow), baseline center, gap đều.
// States NGÔN NGỮ nút Pagination (đồng bộ design system 2026-10-17):
// ngày thường = outline border-line + hover bg-s3; selected = nền accent đặc
// chữ trắng font-medium không viền; today = outline + ring accent; adjacent =
// text-ink3 không viền không hover (pagination disabled).
// Batch ⑧ worker C: + locale (vi/en qua date-picker/locale — prop thắng
// DateLocaleProvider context, default vi giữ behavior cũ) + range highlight
// (endpoint accent đặc, khoảng giữa bg-accent/10 — hover preview RangePicker)
// + onDayHover cho DatePicker range mode.
import { useMemo, useState } from 'react';
import { Icon } from '../icons/index.js';
import { useDateLocale, type DateLocaleInput } from '../date-picker/locale.js';

export interface CalendarRangeValue {
  start?: Date | null;
  end?: Date | null;
  /** Ngày đang hover (khi end chưa chọn) — preview khoảng [start..hover]. */
  hover?: Date | null;
}

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  now?: Date;
  /** 'vi' | 'en' | DateLocale — thắng DateLocaleProvider context; default vi. */
  locale?: DateLocaleInput;
  /** Range mode — highlight start/end + khoảng giữa (antd RangePicker). */
  range?: CalendarRangeValue;
  /** Hover vào ô ngày (chỉ tháng hiện tại) — cho hover preview range. */
  onDayHover?: (date: Date) => void;
  /** Nhúng trong panel DatePicker: bỏ viền/nền/rounded riêng (panel đã có). */
  bare?: boolean;
  className?: string;
}

function getMonthDays(y: number, m: number, firstDayOfWeek: 0 | 1): Date[] {
  const first = new Date(y, m, 1);
  const start = (first.getDay() - firstDayOfWeek + 7) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < start; i++) cells.push(new Date(y, m, -start + i + 1));
  for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(new Date(y, m + 1, cells.length - start - total + 1));
  return cells;
}

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function ChevronLeftIcon() {
  return <Icon name="chevron-left" size={14} />;
}
function ChevronRightIcon() {
  return <Icon name="chevron-right" size={14} />;
}

/* Cell base — VUÔNG (aspect-square w-full), MộT radius (rounded-lg 8), số flex center.
 * Viền/outline nằm ở state class (selected/today/adjacent khác thường). */
const CELL =
  'aspect-square w-full flex items-center justify-center rounded-lg border-none text-body select-none cursor-pointer transition-colors';
const NAV_CLS =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent text-ink transition-colors hover:bg-s3 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none';

export function Calendar({ value, onChange, now = new Date(), locale, range, onDayHover, bare = false, className }: CalendarProps) {
  const loc = useDateLocale(locale);
  const [viewY, setViewY] = useState(value?.getFullYear() ?? now.getFullYear());
  const [viewM, setViewM] = useState(value?.getMonth() ?? now.getMonth());
  const days = useMemo(() => getMonthDays(viewY, viewM, loc.firstDayOfWeek), [viewY, viewM, loc.firstDayOfWeek]);
  const todayK = key(now);
  const valueK = value ? key(value) : '';

  // Range: endpoint keys + biên khoảng preview (end ?? hover, swap nếu hover lùi trước start)
  const startK = range?.start ? key(range.start) : '';
  const endK = range?.end ? key(range.end) : '';
  const previewEnd = range?.end ?? range?.hover ?? null;
  const rangeBounds =
    range?.start && previewEnd
      ? previewEnd >= range.start
        ? { lo: range.start, hi: previewEnd }
        : { lo: previewEnd, hi: range.start }
      : null;

  const prev = () => {
    if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); } else { setViewM((m) => m - 1); }
  };
  const next = () => {
    if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); } else { setViewM((m) => m + 1); }
  };

  return (
    <div
      className={`inline-block p-4${bare ? '' : ' rounded-xl border border-line bg-s2'}${className ? ` ${className}` : ''}`}
      role="grid"
      aria-label="Calendar"
    >
      {/* Header — padding đối xứng */}
      <div className="mb-2 flex items-center justify-between px-1">
        <button type="button" aria-label={loc.prevMonth} onClick={prev} className={NAV_CLS}>
          <ChevronLeftIcon />
        </button>
        <span className="text-body font-semibold text-ink">{loc.months[viewM]} {viewY}</span>
        <button type="button" aria-label={loc.nextMonth} onClick={next} className={NAV_CLS}>
          <ChevronRightIcon />
        </button>
      </div>

      {/* Labels ngày trong tuần — theo locale.weekdays (xếp từ firstDayOfWeek) */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {loc.weekdays.map((d) => (
          <div key={d} className="flex aspect-square items-center justify-center text-meta font-semibold text-ink3">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid — gap-1 đều hàng/cột */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const k = key(date);
          const isCurrent = date.getMonth() === viewM;
          const isToday = k === todayK;
          const isEndpoint = k === startK || k === endK;
          const isSelected = range ? isEndpoint : k === valueK;
          const inRange =
            !!range && !isEndpoint && rangeBounds !== null && date > rangeBounds.lo && date < rangeBounds.hi;

          /* States — PHẲNG 1 màu mỗi state, ngôn ngữ nút Pagination:
           * endpoint/selected = nền accent đặc + chữ trắng font-medium (không viền)
           * in-range         = nền accent/10 (hover preview antd RangePicker)
           * today            = outline + ring accent inset (KHÔNG đổi nền)
           * thường   = outline border-line + hover bg-s3
           * adjacent = text-ink3, không viền, không hover (disabled)      */
          let stateCls: string;
          if (isSelected) {
            stateCls = 'border-none bg-accent text-white font-medium';
          } else if (inRange) {
            stateCls = 'border-none bg-accent/10 text-ink hover:bg-accent/20';
          } else if (isToday) {
            stateCls = 'border border-line bg-transparent text-accent font-medium ring-1 ring-inset ring-accent hover:bg-s3';
          } else if (isCurrent) {
            stateCls = 'border border-line bg-transparent text-ink hover:bg-s3';
          } else {
            stateCls = 'border-none bg-transparent text-ink3 cursor-not-allowed';
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => isCurrent && onChange?.(new Date(viewY, viewM, date.getDate()))}
              onMouseEnter={() => isCurrent && onDayHover?.(date)}
              disabled={!isCurrent}
              aria-label={date.toDateString()}
              className={`${CELL} ${stateCls}${!isCurrent ? ' pointer-events-none' : ''}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
