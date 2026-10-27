import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { isExpired, readClaims, tokenStorage } from '@wakii/fe-shared';
import { Avatar, Button, Divider, Layout, useLocalStorage } from '@wakii/ui-kit';
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

/** Sticky: header dính đỉnh; qua 8px scroll → nền mờ blur + viền (token). */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrolled;
}

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/activity', label: 'Activity' },
] as const;

/**
 * App chrome compose từ ui-kit (redesign shell-kit 2026-10-27): khung là
 * Layout.Header (sticky, role=banner), user chip dùng Avatar kit. GIỮ HÀNH VI:
 * NavLink aria-current="page" (contract test — Menu kit render button/menuitem,
 * không đúng semantic site-nav) + active pill layoutId framer-motion (motion đã
 * duyệt; kit không có nav-pill primitive) + dark toggle + logout refresh-client.
 * Scroll-blur giữ: override qua inline style (kit Header mặc định bg-s1 đặc —
 * inline style thắng chắc, không phụ thuộc thứ tự utilities).
 */
export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrolled = useScrolled();
  const { theme, setTheme } = useHostTheme();
  const token = tokenStorage.getToken();
  const claims = token && !isExpired(token) ? readClaims(token) : null;

  // Logout qua wrapper refresh-client (SF-4): revoke rt server-side + clear CẢ 2 key.
  async function logout() {
    await auth.logout();
    navigate('/login');
  }

  return (
    <Layout.Header
      sticky
      className="flex-wrap"
      style={{
        // Kit Header khoá h-16 — nav cần wrap 2 hàng trên mobile: bỏ height cố định,
        // giữ sàn 64px (≈ h-16) bằng minHeight.
        height: 'auto',
        minHeight: 64,
        // Giữ z cũ (40) — trên mọi content in-flow, dưới portal/modal của remote.
        zIndex: 40,
        transition: 'background-color 300ms ease, border-color 300ms ease',
        // Scroll-blur (landing motion đã duyệt): nền s1 80% + blur khi cuộn;
        // mép trên chưa cuộn thì trong suốt viền.
        backgroundColor: scrolled ? 'color-mix(in oklab, var(--color-s1) 80%, transparent)' : 'var(--color-s1)',
        borderColor: scrolled ? 'var(--color-line)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : undefined,
      }}
    >
      <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
          {/* Logo mark "W" (wakii) — brand chung create-wakii-app/-stack (bộ Icon chưa có glyph logo). */}
          <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M1.5 3l2.2 6L6 5.2 8.3 9l2.2-6" />
          </svg>
        </span>
        Boilerplate
      </span>
      <Divider type="vertical" className="shrink-0 self-center max-md:hidden" />
      <nav aria-label="Điều hướng chính" className="flex flex-wrap gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="relative flex items-center self-stretch rounded-2 px-2.5 py-1.5 text-label no-underline text-ink2 transition-colors hover:text-ink aria-[current=page]:text-ink"
            >
              {/* active pill — layoutId trượt mượt giữa các link (framer-motion) */}
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2 border border-line bg-s3"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {/* Icon-button compact — idiom theo chính template dashboard của kit
         * (nút bell): kit Button có hover-lift/ripple không hợp icon nav. */}
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
              <Avatar
                size={20}
                className="shrink-0"
                style={{
                  // Accent-tinted initial (look đã duyệt) — inline style thắng mặc
                  // định bg-s3 của Avatar mà không phụ thuộc thứ tự utilities.
                  backgroundColor: 'color-mix(in oklab, var(--color-accent) 15%, transparent)',
                  color: 'var(--color-accent)',
                }}
              >
                {claims.email?.charAt(0)?.toUpperCase() ?? '?'}
              </Avatar>
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
    </Layout.Header>
  );
}
