import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar } from './index';
import { Menu, type MenuItemData } from '../menu/index';

const meta = { title: 'Navigation/Sidebar', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

function IconHome() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 6.5L7 2l5 4.5V12H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function IconFolder() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 3h3.5L7 5h5v6H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function IconFile() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M4 2h4l2 2v8H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}

const items: MenuItemData[] = [
  { key: 'home', label: 'Trang chủ', icon: <IconHome /> },
  {
    key: 'ql',
    label: 'Quản lý',
    icon: <IconFolder />,
    children: [
      { key: 'ql-cv', label: 'Công việc', icon: <IconFile /> },
      { key: 'ql-tk', label: 'Tài khoản', icon: <IconFile /> },
    ],
  },
  { key: 'bc', label: 'Báo cáo', icon: <IconFile /> },
];

const brand = (
  <span className="flex items-center gap-2">
    <span className="size-7 shrink-0 rounded-lg bg-accent" aria-hidden="true" />
    <span className="truncate text-body font-semibold text-ink">Wakii Demo</span>
  </span>
);

const footer = (
  <span className="flex items-center gap-2">
    <span className="size-7 shrink-0 rounded-pill bg-accent/20 text-center text-body leading-7 text-accent" aria-hidden="true">A</span>
    <span className="truncate text-meta text-ink2">alice@demo.local</span>
  </span>
);

export const SidebarCoBan: S = {
  name: 'Cơ bản — brand + Menu + footer',
  render: () => (
    <div className="h-96">
      <Sidebar brand={brand} footer={footer}>
        <Menu items={items} selectedKey="home" />
      </Sidebar>
    </div>
  ),
};

export const SidebarCollapsed: S = {
  name: 'Collapsed — icon-only 80px',
  render: () => (
    <div className="h-96">
      <Sidebar brand={brand} footer={footer} defaultCollapsed>
        <Menu items={items} selectedKey="home" />
      </Sidebar>
    </div>
  ),
};

export const SidebarDarkTheme: S = {
  name: 'Dark theme showcase',
  render: () => (
    <div data-bp-theme="dark" className="h-96 rounded-xl bg-canvas p-4">
      <Sidebar brand={brand} footer={footer}>
        <Menu items={items} selectedKey="ql-cv" />
      </Sidebar>
    </div>
  ),
};
