// Menu stories — multi-level vertical, horizontal flyout, controlled selection.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, MenuCompactContext, type MenuItemData } from './index';
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

// ── Real-world usage (2026-10-25): app sidebar navigation ──

const ADMIN_NAV: MenuItemData[] = [
  { key: 'dashboard', label: 'Bảng điều khiển', icon: <Icon name="home" size={14} /> },
  {
    key: 'work',
    label: 'Công việc',
    icon: <Icon name="folder" size={14} />,
    children: [
      { key: 'work-list', label: 'Danh sách' },
      { key: 'work-board', label: 'Bảng' },
      { key: 'work-kanban', label: 'Kanban' },
    ],
  },
  { key: 'reports', label: 'Báo cáo', icon: <Icon name="file" size={14} /> },
  { key: 'settings', label: 'Cài đặt', icon: <Icon name="settings" size={14} /> },
];

/** AdminSidebar — vertical two-level menu with controlled selection (the branch
 * containing the selected key opens automatically). */
export const AdminSidebar: S = {
  name: 'Admin sidebar — two-level groups, controlled selectedKey',
  render: () => <AdminSidebarDemo />,
};

function AdminSidebarDemo() {
  const [selected, setSelected] = useState('work-board');
  return (
    <div className="w-56 rounded-xl border border-line bg-s1 p-2">
      <Menu items={ADMIN_NAV} selectedKey={selected} onSelect={setSelected} />
    </div>
  );
}

/** AdminSidebarCompact — the same menu rendered icon-only via MenuCompactContext —
 * exactly what Sidebar shows when collapsed to 80px. */
export const AdminSidebarCompact: S = {
  name: 'Admin sidebar compact — icon-only via MenuCompactContext',
  render: () => (
    <MenuCompactContext.Provider value={true}>
      <div className="w-fit rounded-xl border border-line bg-s1 p-2">
        <Menu items={ADMIN_NAV} selectedKey="dashboard" mode="vertical" />
      </div>
    </MenuCompactContext.Provider>
  ),
};
