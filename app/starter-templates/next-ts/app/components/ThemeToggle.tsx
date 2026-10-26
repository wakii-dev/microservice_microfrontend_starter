// ThemeToggle — dark/light toggle bản 'use client' cho Next app router (cùng
// pattern theme.ts của starter Vite): persist localStorage `app-theme` + đặt
// data-bp-theme trên documentElement → CSS tokens cascade toàn cây, component
// kit ăn theo tự động, không cần code riêng.
// Storage đọc SAU mount (useEffect) để SSR/hydration luôn khớp: server render
// light, client đọc localStorage xong mới đổi — không bao giờ mismatch.
'use client';

import { useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';

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

/** Dark mode toggle — sync `<html data-bp-theme>` + persist localStorage `app-theme`. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<AppTheme>('light');

  // Đọc theme đã persist sau mount — server/client cùng render light lúc hydration.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored = raw === null ? null : (JSON.parse(raw) as AppTheme);
      if (stored === 'dark' || stored === 'light') setTheme(stored);
    } catch {
      // JSON hỏng hoặc storage bị chặn — giữ light
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
  }, [theme]);

  const toggle = () =>
    setTheme((prev) => {
      const next: AppTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // QuotaExceeded / private mode — bỏ qua, theme vẫn đổi trong phiên
      }
      return next;
    });

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Turn off dark mode' : 'Turn on dark mode'}
      className="cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 transition-colors hover:bg-s3"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
