// Schedule stories — peer-dep FullCalendar (lazy import).
// Default (real FC when installed) / Events / StableHeight / CustomFallback.
// Toolbar + frame are skinned via FC_SKIN_CSS: buttons follow the small Button
// pattern (h-8, bg-s2, border-line, hover bg-s3, active view = accent), title is
// text-h3, header bg-s2 with border-line frame via FullCalendar CSS vars.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Schedule } from './index';
const meta = { title: 'Data Display/Schedule', component: Schedule, tags: ['autodocs'] } satisfies Meta<typeof Schedule>;
export default meta;
type S = StoryObj<typeof meta>;

const TODAY = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (n: number) => { const d = new Date(TODAY); d.setDate(d.getDate() + n); return iso(d); };

export const Default: S = {
  name: 'Default — dayGridMonth (requires @fullcalendar/*)',
  args: {
    events: [
      { id: 'e1', title: 'Sprint review', start: plus(1) },
      { id: 'e2', title: 'Retro', start: plus(3) },
    ],
  },
};

export const StableHeight: S = {
  name: 'Stable height — fixed 520px frame (no jump between 5/6-row months)',
  args: {
    height: 520,
    events: [{ id: 'e1', title: 'Sprint review', start: plus(1) }],
  },
};

function EventsDemo() {
  const [clicked, setClicked] = useState<string | null>(null);
  return (
    <div className="max-w-3xl">
      <Schedule
        events={[
          { id: 't1', title: 'Task #101', start: plus(0) },
          { id: 't2', title: 'Task #102', start: plus(2) },
          { id: 't3', title: 'Task #103', start: plus(2) },
        ]}
        onEventClick={setClicked}
      />
      <p className="mt-2 text-label text-ink3">Last clicked event id: {clicked ?? '—'}</p>
    </div>
  );
}

export const Events: S = {
  name: 'Events + onEventClick (click event → readout)',
  render: () => <EventsDemo />,
};

export const CustomFallback: S = {
  name: 'Custom fallback when @fullcalendar/* missing',
  args: { fallback: <p className="p-4 text-body text-ink3">Schedule needs @fullcalendar/* packages — see ui-kit README.</p> },
};
