// Switch stories — Basic / Small / WithLabels (ON-OFF cross-fade) / Disabled / DarkTheme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './index';

/** Instant on/off toggle — `role=switch` + `aria-checked` built in. */
const meta = { title: 'Forms/Switch', component: Switch, tags: ['autodocs'] } satisfies Meta<typeof Switch>;
export default meta;
type S = StoryObj<typeof meta>;

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={setOn} aria-label="Toggle demo" />;
}

export const Basic: S = {
  name: 'Basic — gradient + spring pop',
  render: () => <Toggle />,
};

export const Small: S = {
  name: 'Small 36×16',
  render: () => (
    <div className="flex items-center gap-3">
      <Switch size="small" aria-label="Small 1" />
      <Switch size="small" checked aria-label="Small 2" />
    </div>
  ),
};

function WithLabelsDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-3">
      <Switch checked={on} onChange={setOn} checkedChildren="ON" unCheckedChildren="OFF" aria-label="With labels" />
      <span className="text-meta text-ink2">{on ? 'On' : 'Off'}</span>
    </div>
  );
}

export const WithLabels: S = {
  name: 'WithLabels — ON/OFF cross-fade 150ms',
  render: () => <WithLabelsDemo />,
};

export const Disabled: S = {
  name: 'Disabled — flat, no handle shadow',
  render: () => (
    <div className="flex items-center gap-3">
      <Switch disabled aria-label="Disabled off" />
      <Switch disabled checked aria-label="Disabled on" />
    </div>
  ),
};

function ControlledDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Switch checked={on} onChange={setOn} />
      <p className="m-0 font-mono text-meta text-ink3">checked: <strong className="text-ink">{String(on)}</strong></p>
    </div>
  );
}

/** Controlled — useState demo: flip updates state. */
export const Controlled: S = {
  render: () => <ControlledDemo />,
};

export const DarkTheme: S = {
  name: 'Dark theme',
  /* Soft bg-s2 card (dark = muted gray) like a real card surface — not a harsh
   * near-black box on the light canvas (user feedback). */
  render: () => (
    <div data-bp-theme="dark" className="inline-flex items-center gap-4 rounded-xl bg-s2 p-4">
      <Switch checked aria-label="Dark 1" />
      <Switch aria-label="Dark 2" />
      <Switch checked size="small" aria-label="Dark 3" />
    </div>
  ),
};

