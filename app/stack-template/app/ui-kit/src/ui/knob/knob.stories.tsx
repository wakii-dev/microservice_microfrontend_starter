import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Knob } from './index';

const meta = { title: 'Forms/Knob', component: Knob, tags: ['autodocs'] } satisfies Meta<typeof Knob>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — dial at 40/100; drag the ring or focus + arrow keys (±1). */
export const Basic: S = { args: { value: 40, ariaLabel: 'Volume' } };

/** MinMax — dial over a [20, 80] window (range maps to the 270° arc). */
export const MinMax: S = { name: 'Min/Max — 270° arc over [20, 80]', args: { value: 50, min: 20, max: 80, ariaLabel: 'Threshold' } };

/** Sizes — 64 / 96 (default) / 128 px. */
export const Sizes: S = {
  name: 'Sizes — 64 / 96 / 128',
  render: () => (
    <div className="flex items-center gap-6">
      <Knob value={30} size={64} ariaLabel="Small knob" />
      <Knob value={60} ariaLabel="Middle knob" />
      <Knob value={90} size={128} ariaLabel="Large knob" />
    </div>
  ),
};

/** Controlled — drag / arrow keys → value shown below. */
export const Controlled: S = {
  render: () => <KnobControlledDemo />,
};

/** DarkTheme — ring + label on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-fit rounded-xl bg-canvas p-4">
      <Knob value={75} ariaLabel="Dark knob" />
    </div>
  ),
};

function KnobControlledDemo() {
  const [v, setV] = useState(40);
  return (
    <div className="grid max-w-[160px] gap-2 justify-items-center">
      <Knob value={v} onChange={setV} ariaLabel="Controlled knob" />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v}</strong></p>
    </div>
  );
}
