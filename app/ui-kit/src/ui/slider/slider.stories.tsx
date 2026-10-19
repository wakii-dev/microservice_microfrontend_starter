import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './index';

const meta = { title: 'Forms/Slider', component: Slider, tags: ['autodocs'] } satisfies Meta<typeof Slider>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — single value 0–100. */
export const Basic: S = { args: { value: 50, min: 0, max: 100, ariaLabel: 'Volume' } };

/** Range — two handles [20, 80] with onRangeChange. */
export const Range: S = { name: 'Range — 2 handles', args: { range: [20, 80], min: 0, max: 100, ariaLabel: 'Price range' } };

/** Step — step=10 snaps to the grid. */
export const Step: S = { name: 'Step — step 10', args: { value: 30, min: 0, max: 100, step: 10, ariaLabel: 'Snapped' } };

/** Disabled — locked track + dimmed. */
export const Disabled: S = { args: { value: 40, disabled: true, ariaLabel: 'Locked slider' } };

/** Bounds — endpoints 0 and 100: fill and handle hug their edges. */
export const Bounds: S = {
  name: 'Bounds — value 0 and 100 (endpoint handles)',
  render: () => (
    <div className="grid max-w-[320px] gap-4">
      <div className="grid gap-1">
        <span className="text-meta text-ink3">min (0)</span>
        <Slider value={0} min={0} max={100} ariaLabel="Lower bound" onChange={() => {}} />
      </div>
      <div className="grid gap-1">
        <span className="text-meta text-ink3">max (100)</span>
        <Slider value={100} min={0} max={100} ariaLabel="Upper bound" onChange={() => {}} />
      </div>
    </div>
  ),
};

/** Controlled — useState demo: click track / arrow keys → value shown. */
export const Controlled: S = {
  render: () => <SliderControlledDemo />,
};

/** DarkTheme — track + handles on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-[320px] rounded-xl bg-canvas p-4">
      <Slider value={50} min={0} max={100} ariaLabel="Volume" onChange={() => {}} />
    </div>
  ),
};

function SliderControlledDemo() {
  const [v, setV] = useState(25);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Slider value={v} onChange={setV} min={0} max={100} ariaLabel="Brightness" />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v}</strong></p>
    </div>
  );
}
