// router — shell app (header sticky: brand W + dark toggle, copy pattern shell
// NavBar) + lazy-load routes qua Suspense fallback Skeleton. Thêm trang mới:
// 1) tạo src/routes/<tên>.tsx (default export component)
// 2) khai báo 1 dòng <Route> trong <Routes> dưới đây (+ NavLink nếu cần điều
//    hướng — tham khảo product-ts khi project nhiều trang).
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Skeleton } from '@wakii/ui-kit';
import { useAppTheme } from '@/app/theme';

const HomePage = lazy(() => import('@/routes/home'));
const NotFoundPage = lazy(() => import('@/routes/not-found'));

/* Fallback khi chunk route đang load — skeleton khung trang, không nhảy layout. */
function RouteFallback() {
  return (
    <div aria-busy="true">
      <Skeleton variant="text" className="mb-6 h-8 w-64" />
      <Skeleton variant="card" className="mb-6 h-40" />
      <Skeleton variant="row" count={3} />
    </div>
  );
}

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

export function Router() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Header sticky — brand + dark toggle (giữ brand, copy shell NavBar) */}
      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-line bg-s1/80 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] w-full max-w-5xl items-center gap-x-4 px-6">
          <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
              {/* Logo mark "W" (wakii) — brand riêng của app scaffold, bộ Icon
                  chưa có glyph logo (precedent Sun/Moon icon ở trên). */}
              <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M1.5 3l2.2 6L6 5.2 8.3 9l2.2-6" />
              </svg>
            </span>
            {'{{appName}}'}
          </span>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Turn off dark mode' : 'Turn on dark mode'}
              className="cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 transition-colors hover:bg-s3"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<NotFoundPage />} path="*" />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
