import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { NavBar } from './NavBar';

/**
 * Layout khung chung: skip link (a11y) + nav + main.
 * Route focus management: mỗi lần đổi route, focus chuyển vào <main> (tabIndex -1)
 * — screen reader/số phím đọc nội dung mới thay vì đứng ở link cũ (a11y baseline, có test).
 */
export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Tới nội dung chính
      </a>
      <NavBar />
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focus target cho route change */}
      <main className="sh-main" id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
