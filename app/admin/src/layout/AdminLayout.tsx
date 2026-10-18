// AdminLayout — shell app admin (batch ⑦): Sidebar ui-kit (collapsible) + Menu đa cấp
// + Header (Input search, bell + Badge, avatar Dropdown đăng xuất giả, dark toggle
// qua data-bp-theme + useLocalStorage persist). Route transition: key pathname →
// bp-fade-in mỗi lần đổi trang (motion identity — chỉ animate transform/opacity).
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  Avatar,
  Badge,
  Dropdown,
  Icon,
  Menu,
  Sidebar,
  Switch,
  message,
  useLocalStorage,
  type MenuItemData,
} from '@wakii/ui-kit';

/* Badge count đè GÓC icon (absolute) — không chiếm layout, không tràn rìa khi
 * sidebar compact (fix ⑥-3): size-4, text-[9px], ring nền surface tách viền. */
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

function Header({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-[var(--z-dropdown)] flex h-14 items-center gap-3 border-b border-line bg-s1 px-4 md:px-6">
      <label className="relative hidden min-w-0 flex-1 sm:block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3">
          <Icon name="search" size={14} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm…"
          aria-label="Tìm kiếm toàn cục"
          className="h-8 w-full max-w-xs rounded-2 border border-line bg-s2 pl-8 pr-3 text-body text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none"
        />
      </label>
      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          aria-label="Thông báo (3 mới)"
          className="relative cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 hover:bg-s3"
        >
          <Icon name="bell" size={18} />
          <span className="absolute -right-1 -top-1">
            <Badge variant="failed">3</Badge>
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleDark}
          aria-label={dark ? 'Tắt dark mode' : 'Bật dark mode'}
          className="cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 hover:bg-s3"
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
    </header>
  );
}

// Dropdown được import từ barrel ở đầu file

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('admin-theme', 'light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Dark theme qua data-bp-theme (ui-kit dark.css override theo attr này)
  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
    return () => document.documentElement.removeAttribute('data-bp-theme');
  }, [theme]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        ariaLabel="Sidebar admin"
        brand={
          sidebarCollapsed ? (
            /* Compact: chỉ logo W, căn giữa ngang (fix ⑥-1 — hết tràn chữ). */
            <div className="flex w-full justify-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-2 bg-accent text-label font-bold text-white">W</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="grid size-7 shrink-0 place-items-center rounded-2 bg-accent text-label font-bold text-white">W</span>
              <span className="whitespace-nowrap text-body font-semibold text-ink">Wakii Admin</span>
            </div>
          )
        }
        footer={
          <div className={`flex items-center gap-2 px-2${sidebarCollapsed ? ' justify-center' : ''}`}>
            <Switch
              size="small"
              checked={theme === 'dark'}
              onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Dark mode"
            />
            {!sidebarCollapsed && <span className="whitespace-nowrap text-meta text-ink3">Dark mode</span>}
          </div>
        }
        onToggle={setSidebarCollapsed}
      >
        <Menu
          items={MENU_MAIN}
          mode="vertical"
          selectedKey={location.pathname}
          onSelect={(key) => {
            if (key.startsWith('/')) navigate(key);
          }}
        />
        {/* Divider mảnh tách nhóm chính/phụ — đều nhịp dọc cả expanded lẫn compact (fix ⑥-5). */}
        <div role="separator" className="my-2 border-t border-line" />
        <Menu
          items={MENU_SECONDARY}
          mode="vertical"
          selectedKey={location.pathname}
          onSelect={(key) => {
            if (key.startsWith('/')) navigate(key);
          }}
        />
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header dark={theme === 'dark'} onToggleDark={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <main
          key={location.pathname}
          className="min-w-0 flex-1 animate-[bp-fade-in_var(--motion-base)_var(--ease-enter)] p-4 md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
