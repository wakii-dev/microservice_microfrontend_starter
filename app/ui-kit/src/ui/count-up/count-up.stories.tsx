// CountUp stories — rAF ease-out counters. Reload the story (or press the
// live-update buttons) to replay the animation.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.js';
import { Statistic } from '../statistic/index.js';
import { CountUp } from './index';

// Meta WITHOUT `component` — value is a required prop, CSF would force args on
// render-only stories (image.stories pattern).
const meta = { title: 'Theming & Motion/CountUp', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — integer count over 1.2s (default duration). */
export const Basic: Story = {
  name: 'Basic — 0 → 482 over 1.2s',
  render: () => (
    <p className="m-0 text-3xl font-semibold text-ink">
      <CountUp value={482} />
    </p>
  ),
};

/** Decimals — fractional value rendered with fixed precision. */
export const Decimals: Story = {
  name: 'Decimals — 3.14159 at 2 decimals',
  render: () => (
    <p className="m-0 text-3xl font-semibold text-ink">
      <CountUp value={3.14159} decimals={2} duration={0.8} />
      <span className="ml-2 text-base font-normal text-ink3">km</span>
    </p>
  ),
};

/** Format — custom formatter (vi-VN grouping) around the rounded number. */
export const Format: Story = {
  name: 'Format — vi-VN thousand grouping',
  render: () => (
    <p className="m-0 text-3xl font-semibold text-ink">
      <CountUp value={1284000} duration={1.5} format={(n) => n.toLocaleString('vi-VN')} />
      <span className="ml-2 text-base font-normal text-ink3">₫</span>
    </p>
  ),
};

/** InStatistic — CountUp as the value of a Statistic (dashboard pairing). */
export const InStatistic: Story = {
  name: 'In Statistic — dashboard pairing',
  render: () => (
    <div className="grid max-w-md grid-cols-2 gap-4">
      <Statistic title="Tasks completed" value={<CountUp value={1284} />} suffix="tasks" />
      <Statistic title="On-time rate" value={<CountUp value={96.4} decimals={1} />} suffix="%" prefix="↑" />
    </div>
  ),
};

/** LiveUpdate — changing value animates from the currently shown number. */
export const LiveUpdate: Story = {
  name: 'Live update — value changes re-animate from current',
  render: () => <LiveUpdateDemo />,
};

function LiveUpdateDemo() {
  const [value, setValue] = useState(500);
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <p className="m-0 text-3xl font-semibold text-ink">
        <CountUp value={value} duration={0.6} />
      </p>
      <div className="flex gap-2">
        <Button onClick={() => setValue((v) => Math.max(0, v - 250))}>− 250</Button>
        <Button type="primary" onClick={() => setValue((v) => v + 250)}>
          + 250
        </Button>
      </div>
      <p className="m-0 text-meta text-ink3">Each press counts from the number currently on screen — no jump cut.</p>
    </div>
  );
}
