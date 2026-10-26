import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, type CalendarRangeValue } from './index';
const meta = { title: 'Forms/Calendar', component: Calendar, tags: ['autodocs'] } satisfies Meta<typeof Calendar>;
export default meta;
type S = StoryObj<typeof meta>;

const NOW = new Date(2026, 9, 18);
const fmt = (d?: Date | null) => (d ? d.toLocaleDateString('vi-VN') : '—');

/** Basic — current month, no selection. */
export const Basic: S = {};

/** LocaleEN — English weekday/month labels. */
export const LocaleEN: S = {
  name: 'Locale EN',
  args: { locale: 'en' },
};

function CalendarControlledDemo() {
  const [d, setD] = useState<Date | undefined>();
  return (
    <div className="grid max-w-[320px] gap-3">
      <Calendar value={d} onChange={setD} />
      <p className="m-0 font-mono text-meta text-ink3">
        value: <strong className="text-ink">{d ? d.toLocaleDateString('vi-VN') : '—'}</strong>
      </p>
    </div>
  );
}

/** Range — endpoints + in-range preview (same engine that drives DatePicker range). */
export const Range: S = {
  name: 'Range — endpoints + hover preview',
  render: () => <CalendarRangeDemo />,
};

function DayHoverDemo() {
  const [hovered, setHovered] = useState<Date | undefined>();
  return (
    <div className="grid max-w-[320px] gap-3">
      <Calendar now={NOW} onDayHover={setHovered} />
      <p className="m-0 font-mono text-meta text-ink3">
        hovered: <strong className="text-ink">{fmt(hovered)}</strong>
      </p>
    </div>
  );
}

/** Bare — no outer border/padding; embed inside panels or cards. */
export const Bare: S = {
  name: 'Bare — borderless embed',
  render: () => (
    <div className="w-[320px] rounded-xl border border-line bg-s1 p-3">
      <Calendar bare now={NOW} />
    </div>
  ),
};

/** DayHover — onDayHover fires as the pointer moves across days (drives DatePicker range preview). */
export const DayHover: S = {
  name: 'DayHover — onDayHover readout (drives range preview)',
  render: () => <DayHoverDemo />,
};

/** Controlled — useState demo: click a day → selected + shown below. */
export const Controlled: S = {
  render: () => <CalendarControlledDemo />,
};

/** DarkTheme — month grid on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-[320px] rounded-xl bg-canvas p-4">
      <Calendar />
    </div>
  ),
};

function CalendarRangeDemo() {
  const [range, setRange] = useState<CalendarRangeValue>({});
  const pick = (d: Date) => {
    if (!range.start || (range.start && range.end)) setRange({ start: d, hover: null, end: null });
    else if (d < range.start) setRange({ start: d, end: range.start, hover: null });
    else setRange({ ...range, end: d, hover: null });
  };
  return (
    <div className="grid max-w-[320px] gap-3">
      <Calendar
        now={NOW}
        range={range}
        onChange={pick}
        onDayHover={(d) => setRange((r) => (r.start && !r.end ? { ...r, hover: d } : r))}
      />
      <p className="m-0 font-mono text-meta text-ink3">
        range: <strong className="text-ink">{fmt(range.start)} → {fmt(range.end)}</strong>
      </p>
    </div>
  );
}

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / header / weekdays / grid
 * / day) + style passthrough. `root` lands on the outer role=grid div (same
 * element as `className`), `header` on the prev/next row, `weekdays`/`grid` on
 * the two 7-col grids, `day` on every day button; `style` lands on the root. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Calendar
      now={new Date(2026, 9, 15)}
      value={new Date(2026, 9, 18)}
      classNames={{
        root: 'rounded-lg border-st-done',
        header: 'bg-accent/5 rounded-lg',
        weekdays: 'text-accent',
        grid: 'gap-2',
        day: 'tracking-wide',
      }}
      style={{ padding: 12, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
    />
  ),
};
