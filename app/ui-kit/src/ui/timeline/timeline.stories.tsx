// Timeline stories — Default / ActivityFeed / CustomColors / Empty / DarkTheme.
// Timeline is a pure display component (items read-only) — no controlled story.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './index';
/** Vertical activity feed — dot + text + time per entry. */
const meta = { title: 'Data Display/Timeline', component: Timeline, tags: ['autodocs'] } satisfies Meta<typeof Timeline>;
export default meta;
type S = StoryObj<typeof meta>;

export const Default: S = {
  name: 'Default — accent dot + rail',
  args: { items: [
    { key: '1', children: 'Step 1 — initialized' },
    { key: '2', color: 'var(--st-done)', children: 'Step 2 — done', label: '10:00' },
  ] },
};

export const ActivityFeed: S = {
  args: { items: [] },
  name: 'Activity feed — time labels + status colors',
  render: () => (
    <div className="max-w-md">
      <Timeline items={[
        { key: 'a', color: 'var(--st-done)', children: 'alice created task "Design mockup"', label: '08:30' },
        { key: 'b', children: 'bob assigned the task to themselves', label: '09:15' },
        { key: 'c', color: 'var(--st-doing)', children: 'bob moved it to In progress', label: '09:20' },
        { key: 'd', color: 'var(--st-fail)', children: 'saga assignment failed — retrying', label: '09:25' },
      ]} />
    </div>
  ),
};

export const CustomColors: S = {
  args: { items: [] },
  name: 'Custom colors via tokens + default accent dot',
  render: () => (
    <Timeline items={[
      { key: '1', color: 'var(--st-done)', children: 'Done — token --st-done' },
      { key: '2', color: 'var(--st-doing)', children: 'Doing — token --st-doing' },
      { key: '3', children: 'No color — default accent dot' },
    ]} />
  ),
};

export const Empty: S = {
  name: 'Empty items — bare ol, no crash',
  args: { items: [] },
};

export const DarkTheme: S = {
  args: { items: [] },
  name: 'Dark theme — rail + dot follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="max-w-md rounded-xl bg-s2 p-4">
      <Timeline items={[
        { key: '1', color: 'var(--st-done)', children: 'Deploy finished', label: '22:00' },
        { key: '2', children: 'CI green', label: '22:05' },
      ]} />
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: mode + pending) ──

export const AlternateMode: S = {
  name: 'Mode alternate — content alternates around the center rail',
  args: { items: [] },
  render: () => (
    <Timeline
      mode="alternate"
      items={[
        { key: '1', children: 'Sprint started', label: 'Mon 09:00' },
        { key: '2', color: 'var(--st-doing)', children: 'Mid-sprint review', label: 'Wed 14:00' },
        { key: '3', color: 'var(--st-done)', children: 'Released v1.2', label: 'Fri 18:00' },
      ]}
    />
  ),
};

export const Pending: S = {
  name: 'Pending — hollow dot continues from the last item',
  args: { items: [] },
  render: () => (
    <Timeline
      items={[
        { key: '1', children: 'Deploy finished', label: '22:00' },
        { key: '2', children: 'Smoke tests green', label: '22:05' },
      ]}
      pending={<>Rolling out to production…</>}
    />
  ),
};
