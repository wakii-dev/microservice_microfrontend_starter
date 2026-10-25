import { useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { isExpired, readClaims, tokenStorage } from '@wakii/fe-shared';
import { Button, Icon, useLocalStorage } from '@wakii/ui-kit';
import { auth } from '../api';

/* Dark toggle toàn host (batch ⑰ — pattern AdminLayout): data-bp-theme trên
 * <html> + useLocalStorage persist. Remote trong host ăn theo CSS cascade —
 * remotes không cần code riêng. */
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

function useHostTheme() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('shell-theme', 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
  }, [theme]);
  return { theme, setTheme };
}

/**
 * App chrome (hand-off §4): brand + nav + dark toggle + user chip/logout.
 * Active state: NavLink tự set aria-current="page" — visual = gạch accent 2px dưới
 * (after: utilities). Đọc token MỖI render (không useState cache) — login/logout
 * navigate là re-render trigger, nav cập nhật email ngay.
 */
const NAV_LINK =
  "relative flex items-center self-stretch rounded-2 px-2.5 text-label no-underline text-ink2 transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-2 aria-[current=page]:after:right-2 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-[1px] aria-[current=page]:after:bg-accent aria-[current=page]:after:content-['']";

export function NavBar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useHostTheme();
  const token = tokenStorage.getToken();
  const claims = token && !isExpired(token) ? readClaims(token) : null;

  // Logout qua wrapper refresh-client (SF-4): revoke rt server-side + clear CẢ 2 key
  // (tokenStorage + bp.rt) — logout() không ném khi mạng chết nên await an toàn.
  async function logout() {
    await auth.logout();
    navigate('/login');
  }

  return (
    <header className="flex min-h-[52px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-s1 px-4 py-2 max-md:px-3">
      <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
          <Icon name="menu-bars" size={12} className="text-white" />
        </span>
        Boilerplate
      </span>
      <span aria-hidden="true" className="h-[18px] w-px shrink-0 self-center bg-line max-md:hidden" />
      <nav aria-label="Điều hướng chính" className="flex flex-wrap gap-0.5">
        <NavLink className={NAV_LINK} end to="/">
          Trang chủ
        </NavLink>
        <NavLink className={NAV_LINK} to="/tasks">
          Tasks
        </NavLink>
        <NavLink className={NAV_LINK} to="/activity">
          Activity
        </NavLink>
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Tắt dark mode' : 'Bật dark mode'}
          className="cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 transition-colors hover:bg-s3"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        {claims ? (
          <>
            <span
              className="flex h-7 max-w-[260px] items-center gap-2 rounded-2 border border-line bg-s2 py-0 pl-1 pr-2.5 max-md:max-w-[180px]"
              data-testid="nav-user"
            >
              {/* token hiếm khi thiếu email (readClaims chỉ validate sub) — guard tránh trắng nav */}
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center rounded-pill bg-accent/15 text-meta font-semibold text-accent"
              >
                {claims.email?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-meta text-ink2">
                {claims.email}
              </span>
            </span>
            <Button type="text" onClick={logout}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <Link
            className="inline-flex h-8 cursor-pointer items-center rounded-2 border-transparent bg-transparent px-[15px] text-body text-ink2 transition-colors hover:bg-s3 hover:text-ink"
            to="/login"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
