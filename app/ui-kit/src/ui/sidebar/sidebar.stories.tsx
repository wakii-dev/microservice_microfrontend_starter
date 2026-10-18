// Sidebar stories — Basic (brand + Menu + footer) / Collapsed / Dark theme.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar } from './index';
import { Menu, type MenuItemData } from '../menu/index';
import { Icon } from '../icons/index.js';

const meta = { title: 'Navigation/Sidebar', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const items: MenuItemData[] = [
  { key: 'home', label: 'Home', icon: <Icon name="home" size={14} /> },
  {
    key: 'manage',
    label: 'Manage',
    icon: <Icon name="folder" size={14} />,
    children: [
      { key: 'tasks', label: 'Tasks', icon: <Icon name="file" size={14} /> },
      { key: 'accounts', label: 'Accounts', icon: <Icon name="file" size={14} /> },
    ],
  },
  { key: 'reports', label: 'Reports', icon: <Icon name="file" size={14} /> },
];

const brand = (
  <span className="flex items-center gap-2">
    <span className="size-7 shrink-0 rounded-lg bg-accent" aria-hidden="true" />
    <span className="truncate text-body font-semibold text-ink">Wakii Admin</span>
  </span>
);

const footer = (
  <span className="flex items-center gap-2">
    <span className="size-7 shrink-0 rounded-pill bg-accent/20 text-center text-body leading-7 text-accent" aria-hidden="true">A</span>
    <span className="truncate text-meta text-ink2">alice@demo.local</span>
  </span>
);

export const Basic: S = {
  name: 'Basic — brand + Menu + footer',
  render: () => (
    <div className="h-96">
      <Sidebar brand={brand} footer={footer}>
        <Menu items={items} selectedKey="home" />
      </Sidebar>
    </div>
  ),
};

export const Collapsed: S = {
  name: 'Collapsed — icon-only 80px',
  render: () => (
    <div className="h-96">
      <Sidebar brand={brand} footer={footer} defaultCollapsed>
        <Menu items={items} selectedKey="home" />
      </Sidebar>
    </div>
  ),
};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="h-96 rounded-xl bg-canvas p-4">
      <Sidebar brand={brand} footer={footer}>
        <Menu items={items} selectedKey="tasks" />
      </Sidebar>
    </div>
  ),
};
