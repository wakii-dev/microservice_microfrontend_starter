// Switch stories — batch ⑳: CoBan / Small / WithLabels (ON-OFF cross-fade) /
// Disabled / DarkTheme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from './index';

const meta = { title: 'Forms/Switch', component: Switch, tags: ['autodocs'] } satisfies Meta<typeof Switch>;
export default meta;
type S = StoryObj<typeof meta>;

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={setOn} aria-label="Toggle demo" />;
}

export const CoBan: S = {
  name: 'Cơ bản — gradient + spring pop',
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

export const WithLabels: S = {
  name: 'WithLabels — ON/OFF cross-fade 150ms',
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <div className="flex items-center gap-3">
        <Switch checked={on} onChange={setOn} checkedChildren="ON" unCheckedChildren="OFF" aria-label="With labels" />
        <span className="text-meta text-ink2">{on ? 'Bật' : 'Tắt'}</span>
      </div>
    );
  },
};

export const Disabled: S = {
  name: 'Disabled — phẳng, không shadow handle',
  render: () => (
    <div className="flex items-center gap-3">
      <Switch disabled aria-label="Disabled off" />
      <Switch disabled checked aria-label="Disabled on" />
    </div>
  ),
};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="inline-flex items-center gap-3 rounded-xl bg-canvas p-4">
      <Switch checked aria-label="Dark 1" />
      <Switch aria-label="Dark 2" />
      <Switch checked size="small" aria-label="Dark 3" />
    </div>
  ),
};
