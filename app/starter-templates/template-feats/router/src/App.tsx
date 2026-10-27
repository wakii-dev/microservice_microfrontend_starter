// Overlay ROUTER (react-router v7) — engine COPY các file overlay này đè lên src/
// khi user chọn router, thêm dep `react-router` vào package.json, và BỌC
// <BrowserRouter> trong src/main.tsx (spec overlay: main bọc BrowserRouter).
// ⚠️ Import './theme' viết theo VỊ TRÍ ĐÍCH (src/) — không phải vị trí file này.
// 3 marker EXTRA_IMPORTS / EXTRA_LINKS / EXTRA_ROUTES (trong ngoặc {{ }}) —
// engine chèn import/nav/route của demo extras khi user chọn; không extra nào
// → thay rỗng. Chỉ đặt đúng 1 marker mỗi loại, KHÔNG nhắc nguyên văn trong
// comment (engine replaceAll toàn file).
// App là SHELL thuần (nav + routes + footer + theme toggle) — trang demo nằm ở
// src/features/showcase/: muốn bắt đầu sản phẩm, xoá thư mục đó + vài dòng
// route/nav trong file này, shell giữ nguyên.
import { NavLink, Route, Routes } from 'react-router';
import { Link, Text } from '@wakii/ui-kit';
import { useAppTheme } from './theme';
import { ShowcaseAbout, ShowcaseHome } from './features/showcase';
{{EXTRA_IMPORTS}}

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

/* Active nav — gạch accent 2px dưới qua aria-current (copy pattern shell NavBar). */
const NAV_LINK =
  "relative flex items-center rounded-2 px-2.5 text-label no-underline text-ink2 transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-2 aria-[current=page]:after:right-2 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-[1px] aria-[current=page]:after:bg-accent aria-[current=page]:after:content-['']";

export function App() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-line bg-s1/80 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6">
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
          <span aria-hidden="true" className="h-[18px] w-px shrink-0 self-center bg-line max-md:hidden" />
          <nav aria-label="Main navigation" className="flex flex-wrap gap-0.5">
            <NavLink className={NAV_LINK} end to="/">
              Home
            </NavLink>
            <NavLink className={NAV_LINK} to="/about">
              About
            </NavLink>
            {{EXTRA_LINKS}}
          </nav>
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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12">
        <Routes>
          <Route element={<ShowcaseHome />} path="/" />
          <Route element={<ShowcaseAbout />} path="/about" />
          {{EXTRA_ROUTES}}
        </Routes>
      </main>

      <footer className="mt-auto border-t border-line bg-s1">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-label text-ink3">
          <span>
            Built with <Text strong>@wakii/ui-kit</Text> — {'{{appName}}'}
          </span>
          <div className="flex items-center gap-4">
            <Link href="https://www.npmjs.com/package/@wakii/ui-kit" target="_blank" rel="noreferrer">
              npm
            </Link>
            <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
              Storybook
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
