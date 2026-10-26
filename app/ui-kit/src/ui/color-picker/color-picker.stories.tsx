import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorPicker } from './index';

const meta = { title: 'Forms/ColorPicker', component: ColorPicker, tags: ['autodocs'] } satisfies Meta<typeof ColorPicker>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — default value + preset grid. */
export const Basic: S = { args: { value: '#1677ff' } };

/** CustomPresets — custom color list via presets prop. */
export const CustomPresets: S = {
  name: 'Custom presets',
  args: { value: '#00b96b', presets: ['#00b96b', '#8adaa3', '#ffd666', '#ff9c6e'] },
};

/** Controlled — useState demo: pick a preset / native / hex → swatch follows value. */
export const Controlled: S = {
  render: () => <ColorPickerControlledDemo />,
};

/** Empty — presets=[]: palette falls back to native color + hex input only. */
export const Empty: S = {
  args: { value: '#722ed1', presets: [] },
};

/** DarkTheme — swatch + palette on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <div className="grid max-w-[220px] gap-3">
        <ColorPicker value="#828fff" onChange={() => {}} />
        <p className="m-0 text-meta text-ink3">Open the palette to see swatches and borders on dark.</p>
      </div>
    </div>
  ),
};

function ColorPickerControlledDemo() {
  const [v, setV] = useState('#1677ff');
  return (
    <div className="grid max-w-[220px] gap-3">
      <ColorPicker value={v} onChange={setV} />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v}</strong></p>
    </div>
  );
}

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / trigger / panel /
 * swatch) + style passthrough. `root` lands on the outer column div (same
 * element as `className`), `trigger` on the value swatch button, `panel` on
 * the dropdown frame, `swatch` on every preset; `style` lands on the root. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <ColorPicker
      classNames={{
        root: 'rounded-xl',
        trigger: 'rounded-xl border-st-done border-2',
        panel: 'rounded-lg border-st-done',
        swatch: 'rounded-pill',
      }}
      style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
    />
  ),
};
