import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timesheet, type TimesheetRow } from './index';

const meta = { title: 'Domain/Timesheet', component: Timesheet, tags: ['autodocs'] } satisfies Meta<typeof Timesheet>;
export default meta;
type S = StoryObj<typeof meta>;

// Tue Oct 20 2026 — any day inside the Mon 19 → Sun 25 week (week normalizes to Monday).
const WEEK = new Date(2026, 9, 20);

const ROWS: TimesheetRow[] = [
  { key: 'task-a', label: 'Task A', meta: 'Design system', values: [8, 8, 8, 8, 8, null, null] },
  { key: 'task-b', label: 'Task B', meta: 'Gateway', values: [1, 2, 0.5, null, null, null, null] },
  { key: 'task-c', label: 'Task C', meta: 'e2e suite', values: [null, null, null, 4, 6, 3, null] },
];

const RICH_ROWS: TimesheetRow[] = [
  { key: 'fe-shell', label: 'MF shell', meta: 'Frontend', values: [7.5, 8, 8, 6.5, 4, null, null] },
  { key: 'fe-tasks', label: 'Remote tasks', meta: 'Frontend', values: [0.5, null, null, 1.5, 4, 2, null] },
  { key: 'be-outbox', label: 'Outbox + saga', meta: 'node-svc', values: [6, 6, 6, 6, 6, null, null] },
  { key: 'ops-ci', label: 'CI convergence', meta: 'DevOps', values: [null, null, 2, 2, 2, 4, 1] },
];

/** BasicReadonly — rows × 7 day columns, per-row totals, no inputs. */
export const BasicReadonly: S = {
  args: { rows: ROWS, week: WEEK, locale: 'en' },
};

/** Editable — InputNumber per cell (min 0, max 24, step 0.5); totals recompute live. */
export const Editable: S = {
  // render demo tự quản state — args chỉ để thỏa rows/week required của StoryObj
  args: { rows: ROWS, week: WEEK },
  render: () => <EditableDemo />,
};

/** TotalsFooter — column totals + grand total in the footer (tabular-nums). */
export const TotalsFooter: S = {
  args: { rows: RICH_ROWS, week: WEEK, locale: 'en' },
};

/** WeekendsShaded — Sat/Sun columns get a subtle tint; still editable when `editable`. */
export const WeekendsShaded: S = {
  args: { rows: RICH_ROWS, week: WEEK, editable: true, locale: 'en' },
};

/** Loading — skeleton mirrors the grid while data lands; header stays real. */
export const Loading: S = {
  args: { rows: RICH_ROWS, week: WEEK, loading: true, locale: 'en' },
};

/** WeekNavigation — prev/next rewires the Monday-start week; label + grid animate. */
export const WeekNavigation: S = {
  args: { rows: ROWS, week: WEEK },
  render: () => <WeekNavDemo />,
};

/** VietnameseLocale — default `vi`: T2-first headers, "19–25 Th10 2026" label. */
export const VietnameseLocale: S = {
  args: { rows: ROWS, week: WEEK },
};

function EditableDemo() {
  const [rows, setRows] = useState(ROWS);
  const [last, setLast] = useState('—');
  return (
    <div className="grid max-w-4xl gap-3">
      <Timesheet
        rows={rows}
        week={WEEK}
        editable
        locale="en"
        onCellChange={(rowKey, dayIndex, value) => {
          setRows((prev) =>
            prev.map((r) => (r.key === rowKey ? { ...r, values: r.values.map((v, i) => (i === dayIndex ? value : v)) } : r)),
          );
          setLast(`${rowKey}[${dayIndex}] = ${value}`);
        }}
      />
      <p className="m-0 font-mono text-meta text-ink3">
        last onCellChange: <strong className="text-ink">{last}</strong>
      </p>
    </div>
  );
}

function WeekNavDemo() {
  const [week, setWeek] = useState(WEEK);
  return (
    <div className="grid max-w-4xl gap-3">
      <Timesheet rows={ROWS} week={week} onWeekChange={setWeek} locale="en" />
      <p className="m-0 font-mono text-meta text-ink3">
        controlled week (any day): <strong className="text-ink">{week.toDateString()}</strong>
      </p>
    </div>
  );
}
