import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, type MenuItemData } from './index';

const meta = { title: 'Navigation/Menu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

// Icon SVG 14px stroke currentColor — kế thừa màu item (ink/white/disabled).
function IconHome() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 6.5L7 2l5 4.5V12H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function IconFolder() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 3h3.5L7 5h5v6H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function IconFile() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 2h4l2 2v8H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 2v2h2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function IconUsers() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 11.5c0-1.7 1.3-3 3-3s3 1.3 3 3M9 3.5a2 2 0 010 3.8M9.5 8.7c1.5.3 2.5 1.4 2.5 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}

const baCap: MenuItemData[] = [
  { key: 'home', label: 'Trang chủ', icon: <IconHome /> },
  {
    key: 'ql',
    label: 'Quản lý',
    icon: <IconFolder />,
    children: [
      {
        key: 'ql-tk',
        label: 'Tài khoản',
        icon: <IconUsers />,
        children: [
          { key: 'ql-tk-ds', label: 'Danh sách', icon: <IconFile /> },
          { key: 'ql-tk-vt', label: 'Vai trò', icon: <IconFile /> },
        ],
      },
      { key: 'ql-cv', label: 'Công việc', icon: <IconFile /> },
      { key: 'ql-bc', label: 'Báo cáo', icon: <IconFile /> },
    ],
  },
  { key: 'settings', label: 'Cài đặt', icon: <IconFile />, disabled: true },
];

export const MenuBaCap: S = {
  name: 'Ba cấp — vertical + icon + animate',
  render: () => <Menu items={baCap} className="w-56" />,
};

export const MenuHorizontal: S = {
  name: 'Horizontal — dropdown + flyout',
  render: () => <Menu items={baCap} mode="horizontal" />,
};

export const MenuActiveKey: S = {
  name: 'Active key — selected + onSelect',
  render: () => {
    const [selected, setSelected] = useState('ql-tk-ds');
    return (
      <div className="flex flex-col gap-2">
        <span className="text-meta text-ink2">selectedKey: {selected}</span>
        <Menu items={baCap} selectedKey={selected} onSelect={setSelected} className="w-56" />
      </div>
    );
  },
};

export const MenuDisabled: S = {
  name: 'Disabled item — không click được',
  render: () => <Menu items={[{ key: 'a', label: 'Bình thường' }, { key: 'b', label: 'Bị khóa', disabled: true }]} className="w-56" />,
};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-fit rounded-xl bg-canvas p-4">
      <Menu items={baCap} className="w-56" />
    </div>
  ),
};
