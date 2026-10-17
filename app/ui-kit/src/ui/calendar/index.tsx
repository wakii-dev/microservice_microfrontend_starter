// Calendar — PrimeReact-style month view: ô VUÔNG aspect-square, MỘT radius,
// PHẲNG nền mỗi state (không gradient/shadow), baseline center, gap đều.
// States NGÔN NGỮ nút Pagination (đồng bộ design system 2026-10-17):
// ngày thường = outline border-line + hover bg-s3; selected = nền accent đặc
// chữ trắng font-medium không viền; today = outline + ring accent; adjacent =
// text-ink3 không viền không hover (pagination disabled).
import { useMemo, useState } from 'react';

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  now?: Date;
  className?: string;
}

const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VN = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function getMonthDays(y: number, m: number): Date[] {
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < start; i++) cells.push(new Date(y, m, -start + i + 1));
  for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(new Date(y, m + 1, cells.length - start - total + 1));
  return cells;
}

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function ChevronLeftIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronRightIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

/* Cell base — VUÔNG (aspect-square w-full), MộT radius (rounded-lg 8), số flex center.
 * Viền/outline nằm ở state class (selected/today/adjacent khác thường). */
const CELL =
  'aspect-square w-full flex items-center justify-center rounded-lg border-none text-body select-none cursor-pointer transition-colors';
const NAV_CLS =
  'flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent text-ink transition-colors hover:bg-s3';

export function Calendar({ value, onChange, now = new Date(), className }: CalendarProps) {
  const [viewY, setViewY] = useState(value?.getFullYear() ?? now.getFullYear());
  const [viewM, setViewM] = useState(value?.getMonth() ?? now.getMonth());
  const days = useMemo(() => getMonthDays(viewY, viewM), [viewY, viewM]);
  const todayK = key(now);
  const valueK = value ? key(value) : '';

  const prev = () => { viewM === 0 ? (setViewM(11), setViewY((y) => y - 1)) : setViewM((m) => m - 1); };
  const next = () => { viewM === 11 ? (setViewM(0), setViewY((y) => y + 1)) : setViewM((m) => m + 1); };

  return (
    <div className={`inline-block rounded-xl border border-line bg-s2 p-4${className ? ` ${className}` : ''}`} role="grid" aria-label="Calendar">
      {/* Header — padding đối xứng */}
      <div className="mb-2 flex items-center justify-between px-1">
        <button type="button" aria-label="Tháng trước" onClick={prev} className={NAV_CLS}>
          <ChevronLeftIcon />
        </button>
        <span className="text-body font-semibold text-ink">{MONTHS_VN[viewM]} {viewY}</span>
        <button type="button" aria-label="Tháng sau" onClick={next} className={NAV_CLS}>
          <ChevronRightIcon />
        </button>
      </div>

      {/* Labels T2-CN — cùng grid-cols-7 gap-1, mỗi label same width ô */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAYS_VN.map((d) => (
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
          const isSelected = k === valueK;

          /* States — PHẲNG 1 màu mỗi state, ngôn ngữ nút Pagination:
           * selected = nền accent đặc + chữ trắng font-medium (không viền)
           * today    = outline + ring accent inset (KHÔNG đổi nền)
           * thường   = outline border-line + hover bg-s3
           * adjacent = text-ink3, không viền, không hover (disabled)      */
          let stateCls: string;
          if (isSelected) {
            stateCls = 'border-none bg-accent text-white font-medium';
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
