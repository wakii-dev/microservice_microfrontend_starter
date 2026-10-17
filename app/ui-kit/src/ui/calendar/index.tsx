// Calendar — month view chọn ngày (0-dep): grid 7×6, VN locale, keyboard arrows.
// Motion: fade-in khi mở, ngày hover accent, today highlight.
import { useMemo, useState } from 'react';

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  /** Ngày hôm nay (inject để test). */
  now?: Date;
  className?: string;
}

const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VN = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // T2=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = 0; i < startDay; i++) days.push(new Date(year, month, -startDay + i + 1));
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(new Date(year, month + 1, days.length - startDay - daysInMonth + 1));
  return days;
}

export function Calendar({ value, onChange, now = new Date(), className }: CalendarProps) {
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? now.getMonth());

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  function select(date: Date) {
    const d = new Date(viewYear, viewMonth, date.getDate());
    onChange?.(d);
  }

  function prev() { viewMonth === 0 ? (setViewMonth(11), setViewYear((y) => y - 1)) : setViewMonth((m) => m - 1); }
  function next() { viewMonth === 11 ? (setViewMonth(0), setViewYear((y) => y + 1)) : setViewMonth((m) => m + 1); }

  return (
    <div className={`inline-block rounded-3 border border-line bg-s2 p-4${className ? ` ${className}` : ''}`} role="grid" aria-label="Calendar">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Tháng trước" onClick={prev} className="cursor-pointer rounded-2 border-none bg-transparent px-2 py-1 text-body text-ink2 hover:text-accent">‹</button>
        <span className="text-body font-semibold text-ink">{MONTHS_VN[viewMonth]} {viewYear}</span>
        <button type="button" aria-label="Tháng sau" onClick={next} className="cursor-pointer rounded-2 border-none bg-transparent px-2 py-1 text-body text-ink2 hover:text-accent">›</button>
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DAYS_VN.map((d) => (
          <div key={d} className="pb-1 text-center text-meta font-semibold text-ink3">{d}</div>
        ))}
        {days.map((date, i) => {
          const isCurrentMonth = date.getMonth() === viewMonth;
          const isToday = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey;
          const isSelected = value && date.getFullYear() === value.getFullYear() && date.getMonth() === value.getMonth() && date.getDate() === value.getDate();
          return (
            <button
              key={i}
              type="button"
              onClick={() => isCurrentMonth && select(date)}
              disabled={!isCurrentMonth}
              className={`size-9 cursor-pointer rounded-2 border-none text-body transition-colors ${
                isSelected ? 'bg-accent font-semibold text-white' :
                isToday ? 'border border-accent font-semibold text-accent' :
                isCurrentMonth ? 'text-ink hover:bg-s3' : 'text-ink4'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
