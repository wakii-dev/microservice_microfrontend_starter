// Menu stories — multi-level vertical, horizontal flyout, controlled selection.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, type MenuItemData } from './index';
import { Icon } from '../icons/index.js';

const meta = { title: 'Navigation/Menu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

// IconFolder/IconFile: SVG tạm — primeicons bộ 48 chưa có 'folder'/'file'
// (audit V2 2026-10-18: chờ quyết định thêm icon, không tự sửa path tay).
function IconFolder() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 3h3.5L7 5h5v6H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function IconFile() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 2h4l2 2v8H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 2v2h2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}

const baCap: MenuItemData[] = [
  { key: 'home', label: 'Home', icon: <Icon name="home" size={14} /> },
  {
    key: 'manage',
    label: 'Manage',
    icon: <IconFolder />,
    children: [
      {
        key: 'accounts',
        label: 'Accounts',
        icon: <Icon name="users" size={14} />,
        children: [
          { key: 'accounts-list', label: 'List', icon: <IconFile /> },
          { key: 'accounts-roles', label: 'Roles', icon: <IconFile /> },
        ],
      },
      { key: 'tasks', label: 'Tasks', icon: <IconFile /> },
      { key: 'reports', label: 'Reports', icon: <IconFile /> },
    ],
  },
  { key: 'settings', label: 'Settings', icon: <IconFile />, disabled: true },
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
