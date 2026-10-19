// Layout stories — antd-style shell: Sider (compose Sidebar collapsible) +
// Header sticky + Content + Footer. Demo data từ components cùng kit.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/index';
import { Card } from '../card/index';
import { Icon } from '../icons/index.js';
import { Menu, type MenuItemData } from '../menu/index';
import { Sidebar } from '../sidebar/index';
import { Statistic } from '../statistic/index';
import { Layout } from './index';

const meta = { title: 'Navigation/Layout', component: Layout, tags: ['autodocs'] } satisfies Meta<typeof Layout>;
export default meta;
type S = StoryObj<typeof meta>;

const NAV: MenuItemData[] = [
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

const BRAND = (
  <span className="flex items-center gap-2">
    <span aria-hidden="true" className="size-7 shrink-0 rounded-lg bg-accent" />
    <span className="truncate text-body font-semibold text-ink">Wakii Admin</span>
  </span>
);

const USER_CHIP = (
  <span className="flex items-center gap-2">
    <Avatar size={24}>A</Avatar>
    <span className="truncate text-meta text-ink2">alice@demo.local</span>
  </span>
);

const STATS = [
  { title: 'Người dùng', value: '1.284', delta: '+12%', icon: 'users' as const },
  { title: 'Tasks mở', value: '316', delta: '+5%', icon: 'check-circle' as const },
  { title: 'Đang làm', value: '48', delta: 'tuần này', icon: 'clock' as const },
  { title: 'Gán thất bại', value: '2', delta: 'DLQ', icon: 'exclamation-triangle' as const },
];

const RECENT = [
  'Task #101 — Migration design tokens',
  'Task #102 — Gateway CORS whitelist',
  'Task #103 — Outbox publisher retry',
  'Task #104 — Saga compensation test',
  'Task #105 — DLQ alert threshold',
  'Task #106 — Storybook dark theme docs',
];

/** AppShellDashboard — full shell: collapsible Sider + sticky Header + stat cards + Footer. */
export const AppShellDashboard: S = {
  render: () => <AppShellDemo />,
};

/** WithSiderCollapsed — same shell collapsed: Sider mirrors Sidebar at 80px icon-only. */
export const WithSiderCollapsed: S = {
  render: () => <AppShellDemo initialCollapsed />,
};

/** StickyHeader — no Sider; header stays pinned while long content scrolls. */
export const StickyHeader: S = {
  render: () => (
    <Layout className="min-h-screen">
      <Layout.Header sticky>
        <span className="text-h2 font-semibold text-ink">Sticky header</span>
        <span className="ml-auto text-meta text-ink3">cuộn để thấy bám đỉnh</span>
      </Layout.Header>
      <Layout.Content>
        <div className="flex flex-col gap-3 p-6">
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i} className="m-0 text-body text-ink2">
              Dòng nội dung {i + 1} — banner giữ nguyên vị trí khi cuộn trang.
            </p>
          ))}
        </div>
      </Layout.Content>
      <Layout.Footer>© 2026 Wakii</Layout.Footer>
    </Layout>
  ),
};

/** Minimal — smallest shell: Header + Content + Footer, no Sider. */
export const Minimal: S = {
  render: () => (
    <Layout className="min-h-80">
      <Layout.Header>
        <span className="text-h2 font-semibold text-ink">Minimal</span>
      </Layout.Header>
      <Layout.Content>
        <p className="m-0 p-6 text-body text-ink2">Header + Content + Footer — zone chuẩn, padding do consumer.</p>
      </Layout.Content>
      <Layout.Footer>© 2026 Wakii</Layout.Footer>
    </Layout>
  ),
};

function AppShellDemo({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  // Sidebar tự giữ collapse (trigger pill mép phải 200↔80); Sider mirror qua
  // collapsed để zone row co theo — numbers 200/80 khớp default hai bên.
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <Layout hasSider className="min-h-screen">
      <Layout.Sider collapsed={collapsed}>
        <Sidebar brand={BRAND} footer={USER_CHIP} defaultCollapsed={initialCollapsed} onToggle={setCollapsed}>
          <Menu items={NAV} selectedKey="home" />
        </Sidebar>
      </Layout.Sider>
      <Layout>
        <Layout.Header sticky>
          <span className="text-h2 font-semibold text-ink">Dashboard</span>
          <span className="ml-auto flex items-center gap-3">
            <Icon name="bell" size={16} className="text-ink2" />
            <Avatar size={28}>A</Avatar>
          </span>
        </Layout.Header>
        <Layout.Content>
          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
            {STATS.map((s) => (
              <Card key={s.title}>
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Icon name={s.icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Statistic title={s.title} value={s.value} suffix={s.delta} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="px-6 pb-6">
            <Card title="Recent tasks">
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {RECENT.map((t) => (
                  <li key={t} className="text-body text-ink2">
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Layout.Content>
        <Layout.Footer>© 2026 Wakii — Layout demo shell</Layout.Footer>
      </Layout>
    </Layout>
  );
}
