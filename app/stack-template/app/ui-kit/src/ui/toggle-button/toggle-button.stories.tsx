import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from './index';

/** Button with a pressed state — `checked` surfaces as `aria-pressed`. */
const meta = { title: 'Forms/ToggleButton', component: ToggleButton, tags: ['autodocs'] } satisfies Meta<typeof ToggleButton>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — unchecked state. */
export const Basic: S = { args: { children: 'Toggle', checked: false, onChange: () => {} } };

/** Checked — pressed state. */
export const Checked: S = { args: { children: 'On', checked: true } };

/** Disabled — locked, dimmed (real prop: disabled). */
export const Disabled: S = {
  args: { children: 'Locked', checked: true, disabled: true, onChange: () => {} },
};

/** Controlled — useState demo: click flips checked. */
export const Controlled: S = {
  args: { children: 'Toggle' },
  render: () => <ToggleButtonControlledDemo />,
};

/** DarkTheme — both states on dark canvas. */
export const DarkTheme: S = {
  args: { children: 'Toggle' },
  render: () => (
    <div data-bp-theme="dark" className="flex w-[280px] gap-3 rounded-xl bg-canvas p-4">
      <ToggleButton checked={false} onChange={() => {}}>Off</ToggleButton>
      <ToggleButton checked={true} onChange={() => {}}>On</ToggleButton>
    </div>
  ),
};

function ToggleButtonControlledDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="grid max-w-[240px] gap-3">
      <ToggleButton checked={on} onChange={setOn}>Enable notifications</ToggleButton>
      <p className="m-0 font-mono text-meta text-ink3">checked: <strong className="text-ink">{String(on)}</strong></p>
    </div>
  );
}
