// Menu stories — multi-level vertical, horizontal flyout, controlled selection.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, type MenuItemData } from './index';
import { Icon } from '../icons/index.js';

/** Vertical/horizontal nav menu with nested submenus. */
const meta = { title: 'Navigation/Menu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const baCap: MenuItemData[] = [
  { key: 'home', label: 'Home', icon: <Icon name="home" size={14} /> },
  {
    key: 'manage',
    label: 'Manage',
    icon: <Icon name="folder" size={14} />,
    children: [
      {
        key: 'accounts',
        label: 'Accounts',
        icon: <Icon name="users" size={14} />,
        children: [
          { key: 'accounts-list', label: 'List', icon: <Icon name="file" size={14} /> },
          { key: 'accounts-roles', label: 'Roles', icon: <Icon name="file" size={14} /> },
        ],
      },
      { key: 'tasks', label: 'Tasks', icon: <Icon name="file" size={14} /> },
      { key: 'reports', label: 'Reports', icon: <Icon name="file" size={14} /> },
    ],
  },
  { key: 'settings', label: 'Settings', icon: <Icon name="file" size={14} />, disabled: true },
];

export const ThreeLevels: S = {
  name: 'Three levels — vertical + icons + animation',
  render: () => <Menu items={baCap} className="w-56" />,
};

export const Horizontal: S = {
  name: 'Horizontal — dropdown + flyout',
  render: () => <Menu items={baCap} mode="horizontal" />,
};

function ActiveKeyDemo() {
  const [selected, setSelected] = useState('accounts-list');
  return (
    <div className="flex flex-col gap-2">
      <span className="text-meta text-ink2">selectedKey: {selected}</span>
      <Menu items={baCap} selectedKey={selected} onSelect={setSelected} className="w-56" />
    </div>
  );
}

export const ActiveKey: S = {
  name: 'Active key — selected + onSelect',
  render: () => <ActiveKeyDemo />,
};

export const DisabledItem: S = {
  name: 'Disabled item — not clickable',
  render: () => (
    <Menu
      items={[{ key: 'a', label: 'Normal' }, { key: 'b', label: 'Locked', disabled: true }]}
      className="w-56"
    />
  ),
};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-fit rounded-xl bg-canvas p-4">
      <Menu items={baCap} className="w-56" />
    </div>
  ),
};
