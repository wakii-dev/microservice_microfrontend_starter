// Calendar — PrimeReact-style month view: ô VUÔNG aspect-square, MỘT radius,
// PHẲNG nền mỗi state (không gradient/shadow), baseline center, gap đều.
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

/* Cell base — VUÔNG (aspect-square w-full), MỘT radius (rounded-lg 8), số flex center */
const CELL =
  'aspect-square w-full flex items-center justify-center rounded-lg border-none text-body select-none cursor-pointer transition-colors';

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
        <button type="button" aria-label="Tháng trước" onClick={prev}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-body text-ink2 transition-colors hover:bg-s3 hover:text-accent">‹</button>
        <span className="text-body font-semibold text-ink">{MONTHS_VN[viewM]} {viewY}</span>
        <button type="button" aria-label="Tháng sau" onClick={next}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-body text-ink2 transition-colors hover:bg-s3 hover:text-accent">›</button>
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

          /* States — PHẲNG 1 màu mỗi state, không gradient/shadow:
           * selected = bg accent + text trắng (fill tròn đều)
           * today    = ring 1px accent (KHÔNG đổi nền)
           * hover    = fill s3 nhẹ
           * adjacent = ink3 opacity 40% (không muddy) + disable           */
          let stateCls: string;
          if (isSelected) {
            stateCls = 'bg-accent text-white font-semibold';
          } else if (isToday) {
            stateCls = 'text-accent font-semibold ring-1 ring-inset ring-accent';
          } else if (isCurrent) {
            stateCls = 'text-ink hover:bg-s3';
          } else {
            stateCls = 'text-ink3/40 cursor-default';
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
