// AdminLayout — shell app admin dựng trên khung Layout KIT (Sider đa cấp + Header +
// Content + Footer — same composition Templates/Dashboard §1), thay layout tự vẽ cũ:
// - Layout.Sider bọc Sidebar (collapsible 200↔80) — Sider theo `collapsed`, con cháu
//   đọc qua useSiderCollapsed để brand/label tự co (không prop drill).
// - Responsive: <768px ẩn Sider (useMediaQuery — parity template).
// - Header: search + bell Badge count → Drawer thông báo (reset đã đọc) + toggle
//   dark (useTheme → UiKitProvider toàn app) + avatar Dropdown demo.
// - Customize pass (slots-wave dogfood — showcase luôn slots): Sider/Content dùng
//   classNames slots, Header dùng style passthrough (h-56 dày hơn mặc định).
//   Motion: Content key pathname → animate-fade-in (token --animate-fade-in;
//   prefers-reduced-motion tự rơi về tức thì ở kit CSS).
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Icon,
  Input,
  Layout,
  Menu,
  message,
  Sidebar,
  Switch,
  useMediaQuery,
  useSiderCollapsed,
  type MenuItemData,
} from '@wakii/ui-kit';
import { useTheme } from '../theme.js';

/* Badge count đè GÓC icon (absolute) — không chiếm layout, không tràn rìa khi
 * sidebar compact (fix ⑥-3 giữ từ batch ⑦): size-4, text-[9px], ring nền surface. */
function IconWithCount({ name, count }: { name: 'home' | 'users' | 'star' | 'settings'; count: number }) {
  return (
    <span className="relative inline-flex">
      <Icon name={name} size={16} />
      <span
        aria-hidden="true"
        className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-pill bg-st-fail text-[9px] font-bold leading-none text-white ring-2 ring-s2"
      >
        {count}
      </span>
    </span>
  );
}

const MENU_MAIN: MenuItemData[] = [
  { key: '/', label: 'Dashboard', icon: <IconWithCount name="home" count={7} /> },
  {
    key: 'group-manage',
    label: 'Quản lý',
    icon: <Icon name="users" size={16} />,
    children: [
      { key: '/users', label: 'Users', icon: <Icon name="user" size={14} /> },
      { key: '/upload', label: 'Upload files', icon: <Icon name="upload" size={14} /> },
    ],
  },
  {
    key: 'group-demo',
    label: 'Demo',
    icon: <Icon name="star" size={16} />,
    children: [
      { key: '/demo/hooks', label: 'Hooks', icon: <Icon name="copy" size={14} /> },
      { key: '/demo/components', label: 'Components', icon: <Icon name="menu-bars" size={14} /> },
    ],
  },
];

const MENU_SECONDARY: MenuItemData[] = [{ key: '/settings', label: 'Cài đặt', icon: <Icon name="settings" size={16} /> }];

// Thông báo header — bell mở Drawer, "đánh dấu đã đọc" reset Badge count.
const NOTIFS = [
  { id: 'n1', title: 'Kafka event', desc: 'task.updated — #102 chuyển Đang làm', time: '5p' },
  { id: 'n2', title: 'DLQ', desc: 'assignment_failed — fail@demo.local', time: '2h', danger: true },
  { id: 'n3', title: 'Release', desc: 'ui-kit 0.7.x — slots-wave + theming per-mode', time: '4h' },
];

// Brand + footer Sider đọc collapsed TỪ CONTEXT (useSiderCollapsed) — không drill prop.
function Brand() {
  const collapsed = useSiderCollapsed();
  if (collapsed) {
    /* Compact: chỉ logo W, căn giữa ngang (fix ⑥-1 — hết tràn chữ). */
    return (
      <div className="flex w-full justify-center">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-label font-bold text-white">W</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-label font-bold text-white">W</span>
      <span className="whitespace-nowrap text-body font-semibold text-ink">Wakii Admin</span>
    </div>
  );
}

function SiderFooter() {
  const collapsed = useSiderCollapsed();
  const { mode, setMode } = useTheme();
  return (
    <div className={`flex items-center gap-2 px-2${collapsed ? ' justify-center' : ''}`}>
      <Switch
        size="small"
        checked={mode === 'dark'}
        onChange={(checked) => setMode(checked ? 'dark' : 'light')}
        aria-label="Dark mode"
      />
      {!collapsed && <span className="whitespace-nowrap text-meta text-ink3">Dark mode</span>}
    </div>
  );
}

// MoonIcon/SunIcon — SVG stroke tự vẽ là NGOẠI LỆ được ghi: bộ primeicons 50 của
// ui-kit không có moon/sun (rule 9 cấm tự vẽ khi có Icon thay thế — ở đây không có).
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function Header({ unread, onOpenNotifs }: { unread: number; onOpenNotifs: () => void }) {
  const navigate = useNavigate();
  const { mode, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const dark = mode === 'dark';

  return (
    <Layout.Header
      sticky
      /* Customize pass — style passthrough đè h-16 mặc định về 56px như design cũ. */
      style={{ height: 56 }}
      classNames={{ root: 'pr-4 md:pr-6' }}
    >
      <label className="hidden min-w-0 flex-1 sm:block">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm…"
          aria-label="Tìm kiếm toàn cục"
          prefix={<Icon name="search" size={14} />}
        />
      </label>
      <div className="ml-auto flex items-center gap-4">
        <Badge count={unread}>
          <button
            type="button"
            aria-label={`Thông báo — ${unread} chưa đọc`}
            onClick={onOpenNotifs}
            className="relative grid size-8 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-ink2 transition-colors hover:bg-s3 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          >
            <Icon name="bell" size={18} />
          </button>
        </Badge>
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? 'Tắt dark mode' : 'Bật dark mode'}
          className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-ink2 hover:bg-s3"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <Dropdown
          trigger={
            <button type="button" className="flex cursor-pointer items-center gap-2 rounded-pill border-none bg-transparent p-1 pr-2 hover:bg-s3">
              <Avatar size={28}>AL</Avatar>
              <span className="hidden text-body text-ink md:inline">Alice</span>
              <Icon name="chevron-down" size={12} className="text-ink3" />
            </button>
          }
          items={[
            { key: 'profile', label: 'Hồ sơ' },
            { key: 'settings', label: 'Cài đặt' },
            { key: 'logout', label: 'Đăng xuất', danger: true },
          ]}
          onItemClick={(key) => {
            if (key === 'settings') navigate('/settings');
            if (key === 'profile') message.info('Hồ sơ (demo)');
            if (key === 'logout') message.error('Đăng xuất (demo — chưa nối auth)');
          }}
        />
      </div>
    </Layout.Header>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWide = useMediaQuery('(min-width: 768px)');
  const [collapsed, setCollapsed] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [unread, setUnread] = useState(NOTIFS.length);

  const selectMenu = (key: string) => {
    if (key.startsWith('/')) navigate(key);
  };

  return (
    <Layout hasSider={isWide} className="min-h-screen">
      {isWide && (
        /* Customize pass — Sider sticky: menu luôn nhìn thấy khi content dài (dashboard). */
        <Layout.Sider collapsed={collapsed} classNames={{ root: 'sticky top-0 h-screen' }}>
          <Sidebar
            ariaLabel="Sidebar admin"
            brand={<Brand />}
            footer={<SiderFooter />}
            onToggle={setCollapsed}
          >
            <Menu items={MENU_MAIN} mode="vertical" selectedKey={location.pathname} onSelect={selectMenu} />
            {/* Divider mảnh tách nhóm chính/phụ — đều nhịp dọc cả expanded lẫn compact (fix ⑥-5). */}
            <div role="separator" className="my-2 border-t border-line" />
            <Menu items={MENU_SECONDARY} mode="vertical" selectedKey={location.pathname} onSelect={selectMenu} />
          </Sidebar>
        </Layout.Sider>
      )}
      <Layout>
        <Header unread={unread} onOpenNotifs={() => setNotifsOpen(true)} />
        {/* Content zone = <main> landmark của Layout kit — customize pass qua classNames slots. */}
        <Layout.Content classNames={{ root: 'p-4 md:p-6' }}>
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </Layout.Content>
        <Layout.Footer>© 2026 Wakii Admin — showcase compose 100% @wakii/ui-kit</Layout.Footer>
      </Layout>

      {/* Drawer thông báo — bell mở, đánh dấu đã đọc reset Badge (parity template §9). */}
      <Drawer open={notifsOpen} title="Thông báo" width={360} onClose={() => setNotifsOpen(false)}>
        <div className="grid gap-3">
          {NOTIFS.map((n) => (
            <div key={n.id} className={`rounded-xl border p-3 ${n.danger ? 'border-st-fail/40 bg-st-fail/5' : 'border-line bg-s2'}`}>
              <p className="m-0 flex items-center gap-2 text-label font-medium text-ink">
                {n.danger && <Icon name="exclamation-triangle" size={12} className="text-st-fail" />}
                {n.title}
                <span className="ml-auto font-normal text-meta text-ink3">{n.time}</span>
              </p>
              <p className="m-0 mt-1 text-label text-ink2">{n.desc}</p>
            </div>
          ))}
          <Button
            onClick={() => {
              setUnread(0);
              setNotifsOpen(false);
            }}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </Drawer>
    </Layout>
  );
}
