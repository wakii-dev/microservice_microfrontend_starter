import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Layout as KitLayout } from '@wakii/ui-kit';
import { NavBar } from './NavBar';

/**
 * Layout khung chung — compose từ Layout kit (redesign shell-kit 2026-10-27):
 * root section (bg-canvas flex-col, minHeight 100dvh) + NavBar (Layout.Header
 * sticky) + Layout.Content (<main role="main"> landmark kit).
 * Route focus management: mỗi lần đổi route, focus chuyển vào #main-content
 * (tabIndex -1) — screen reader/keyboard đọc nội dung mới thay vì đứng ở link
 * cũ (a11y baseline, có test).
 * LƯU Ý kit: Layout.Content chưa nhận id/ref/aria passthrough → focus target
 * là div ĐẦU TIÊN trong main mang id="main-content" (test a11y neo đúng).
 */
export function Layout() {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, [location.pathname]);

  return (
    <KitLayout style={{ minHeight: '100dvh' }}>
      <a href="#main-content" className="skip-link">
        Tới nội dung chính
      </a>
      <NavBar />
      <KitLayout.Content>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: focus target cho route change */}
        <div
          className="mx-auto w-full max-w-[1200px] p-6 outline-none focus-visible:outline-2 focus-visible:outline-accent-hi max-md:p-4"
          id="main-content"
          ref={contentRef}
          tabIndex={-1}
        >
          <Outlet />
        </div>
      </KitLayout.Content>
    </KitLayout>
  );
}
