// Tabs stories — Default / Controlled (useState) / DisabledTab / ManyTabs / DarkTheme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './index';
const meta = { title: 'Navigation/Tabs', component: Tabs, tags: ['autodocs'] } satisfies Meta<typeof Tabs>;
export default meta;
type S = StoryObj<typeof meta>;

const ITEMS = [
  { key: '1', label: 'Overview', children: <p>Overview content</p> },
  { key: '2', label: 'Tasks', children: <p>Tasks content</p> },
  { key: '3', label: 'Activity', children: <p>Activity content</p> },
];

export const Default: S = {
  name: 'Default — accent underline slides on switch',
  args: { items: ITEMS },
};

function ControlledDemo() {
  const [active, setActive] = useState('1');
  return (
    <div>
      <Tabs items={ITEMS} activeKey={active} onChange={setActive} />
      <p className="mt-2 text-label text-ink3">activeKey: {active}</p>
    </div>
  );
}

export const Controlled: S = {
  args: { items: ITEMS },
  name: 'Controlled — activeKey + onChange (useState)',
  render: () => <ControlledDemo />,
};

export const DisabledTab: S = {
  name: 'Disabled tab — not clickable',
  args: { items: [...ITEMS.slice(0, 2), { key: 'x', label: 'Permissions', children: <p>not yet</p>, disabled: true }] },
};

export const ManyTabs: S = {
  name: 'Many tabs — 5 items',
  args: {
    items: [...ITEMS, { key: '4', label: 'Reports', children: <p>Reports content</p> }, { key: '5', label: 'Settings', children: <p>Settings content</p> }],
  },
};

export const DarkTheme: S = {
  args: { items: ITEMS },
  name: 'Dark theme — underline + accent text follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-s2 p-4">
      <Tabs items={ITEMS} />
    </div>
  ),
};

export const CustomStyled: S = {
  args: { items: ITEMS },
  name: 'CustomStyled — classNames slots merge after defaults',
  render: () => (
    <Tabs
      items={ITEMS}
      activeKey="2"
      classNames={{
        wrapper: 'rounded-xl border border-dashed border-accent/40 p-2',
        tablist: 'rounded-lg bg-s3 px-2',
        tab: 'italic',
        panel: 'text-accent',
      }}
    />
  ),
};
