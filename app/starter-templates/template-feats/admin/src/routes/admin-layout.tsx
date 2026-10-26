// AdminLayout — chrome app admin: Sidebar collapsible (Menu tự icon-only khi
// thu qua MenuCompactContext của kit) + Header (search, bell, dark toggle,
// avatar dropdown đăng xuất) + <Outlet/> render trang con. Pattern copy
// app/admin của shell; theme state inline tại đây (precedent repo).
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  Avatar,
  Badge,
  Dropdown,
  Icon,
  Input,
  Menu,
  Sidebar,
  Switch,
  message,
  useLocalStorage,
  type MenuItemData,
} from '@wakii/ui-kit';

type AdminTheme = 'light' | 'dark';

const MENU_MAIN: MenuItemData[] = [
  { key: '/', label: 'Dashboard', icon: <Icon name="home" size={16} /> },
  { key: '/tasks', label: 'Tasks', icon: <Icon name="menu-bars" size={16} /> },
];

const MENU_SECONDARY: MenuItemData[] = [
  { key: '/login', label: 'Đăng nhập lại', icon: <Icon name="settings" size={16} /> },
];

/* Sun/moon inline SVG — copy shell NavBar (icon set của kit chưa có sun/moon). */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function useAdminTheme() {
  const [theme, setTheme] = useLocalStorage<AdminTheme>('admin-theme', 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
  }, [theme]);
  return { theme, setTheme };
}

function Header({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-[var(--z-dropdown)] flex h-14 items-center gap-3 border-b border-line bg-s1 px-4 md:px-6">
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
        <button
          type="button"
          aria-label="Thông báo (3 mới)"
          className="relative cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-ink2 hover:bg-s3"
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
            if (key === 'profile') message.info('Hồ sơ (demo)');
            if (key === 'settings') message.info('Cài đặt (demo)');
            if (key === 'logout') navigate('/login');
          }}
        />
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useAdminTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        ariaLabel="Sidebar admin"
        brand={
          sidebarCollapsed ? (
            /* Compact: chỉ logo W, căn giữa ngang (pattern app/admin). */
            <div className="flex w-full justify-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-label font-bold text-white">W</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-label font-bold text-white">W</span>
              <span className="whitespace-nowrap text-body font-semibold text-ink">{'{{appName}}'}</span>
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
