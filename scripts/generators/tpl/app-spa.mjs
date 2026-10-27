// app-spa.mjs — template SPA Vite TS + @wakii/ui-kit (gen-app, non-remote).
// Pattern app/admin hiện tại: Layout kit (Sider+Sidebar+Menu+Header+Content),
// ThemeProvider UiKitProvider dark/light persist, tailwind v4 qua @tailwindcss/vite.
// ctx: { name, camel, pascal, port (dev), date }.

function pkg(ctx) {
  return {
    name: ctx.name,
    private: true,
    version: '0.1.0',
    type: 'module',
    description: `${ctx.pascal} SPA — Vite + @wakii/ui-kit. Sinh bởi scripts/generators gen-app.`,
    scripts: {
      dev: `vite --port ${ctx.port}`,
      build: 'vite build',
      preview: 'vite preview',
      test: 'vitest run',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@wakii/ui-kit': 'workspace:*',
      react: 'catalog:',
      'react-dom': 'catalog:',
      'react-router': 'catalog:',
    },
    devDependencies: {
      '@tailwindcss/vite': '^4.3.3',
      '@testing-library/jest-dom': '6.9.0',
      '@testing-library/react': '16.3.0',
      '@types/react': '19.2.2',
      '@types/react-dom': '19.2.3',
      '@vitejs/plugin-react': '^5.0.0',
      jsdom: '27.0.0',
      tailwindcss: '^4.3.3',
      typescript: '^5.7.0',
      vite: '^7.0.0',
      vitest: '3.2.4',
    },
    engines: { node: '>=22' },
  };
}

const viteConfig = (ctx) =>
  `// Vite — ${ctx.pascal} SPA. Tailwind v4 qua @tailwindcss/vite — theme/utilities đến từ
// ui-kit/styles/tailwind.css (xem src/styles.css: @source qua node_modules symlink).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: ${ctx.port} },
});
`;

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
`;

const vitestConfig = `// Vitest — jsdom + globals, cùng pattern app/admin.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    // JSX automatic runtime — không thì "React is not defined" lúc render
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
});
`;

const setupTs = `import '@testing-library/jest-dom/vitest';

// jsdom thiếu matchMedia — shim trả matches cho min-width:768 để test render
// nhánh Sider wide (pattern app/admin/src/tests/setup.ts).
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: /min-width:\\s*(?:768px|48rem)/.test(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
`;

const indexHtml = (ctx) =>
  `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${ctx.pascal}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const stylesCss = `/* Tailwind v4 entry — copy pattern app/admin/src/styles.css (đã nghiệm chứng):
 * import theme + utilities từ ui-kit (KHÔNG preflight — base.css giữ reset riêng).
 * ⚠️ @source PHẢI trỏ qua node_modules symlink ĐÚNG THỂ: path repo-relative
 * '../ui-kit/src' bị tailwind resolve qua symlink → BỊ IGNORE (chỉ explicit
 * node_modules path được scan). */
@import '@wakii/ui-kit/styles/tailwind.css';

@source './';
@source '../node_modules/@wakii/ui-kit/src';
`;

const mainTsx = (ctx) => `// Entry — ${ctx.pascal} SPA. CSS: tokens + dark theme (import TƯỜNG MINH SAU tokens —
// dark block phải đứng sau :root để thắng specificity ngang — bug toggle không ăn,
// fix 2026-10-18) + base (reset) + tailwind utilities. 1 lần ở root.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@wakii/ui-kit/styles/tokens.css';
import '@wakii/ui-kit/styles/themes/dark.css';
import '@wakii/ui-kit/styles/base.css';
import './styles.css';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const themeTsx = (ctx) =>
  `// ThemeProvider — dark/light TOÀN APP qua UiKitProvider (pattern app/admin):
// state mode persist localStorage, UiKitProvider nhận theme prop → attr data-bp-theme
// trên scope con — cascade CSS var đổi cả subtree. 1 click → toàn app đổi.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { UiKitProvider, useLocalStorage } from '@wakii/ui-kit';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
});

/** mode hiện tại + setMode/toggle — dùng ở Header/Sidebar. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useLocalStorage<ThemeMode>('${ctx.name}-theme', 'light');
  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }),
    [mode, setMode],
  );
  return (
    <ThemeContext.Provider value={value}>
      <UiKitProvider theme={mode}>{children}</UiKitProvider>
    </ThemeContext.Provider>
  );
}
`;

const layoutTsx = (ctx) => {
  const moon = `    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>`;
  const sun = `    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>`;
  return `// AppLayout — khung Layout KIT (Sider+Sidebar+Menu + Header + Content) — pattern
// app/admin/src/layout/AdminLayout.tsx rút gọn: dark toggle ở Header, menu điều
// hướng qua react-router navigate. Thêm trang = thêm menu item + route (gen-feature).
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Icon, Layout, Menu, Sidebar, useMediaQuery, type MenuItemData } from '@wakii/ui-kit';
import { useTheme } from '../theme.js';

const MENU_MAIN: MenuItemData[] = [
  { key: '/', label: 'Trang chủ', icon: <Icon name="home" size={16} /> },
  // GEN:menu — thêm menu item cho trang mới ở đây (gen-feature không tự sửa)
];

// MoonIcon/SunIcon — SVG tự vẽ là NGOẠI LỆ được ghi: primeicons 50 của ui-kit
// không có moon/sun (pattern AdminLayout).
function MoonIcon() {
  return (
${moon}
  );
}

function SunIcon() {
  return (
${sun}
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWide = useMediaQuery('(min-width: 768px)');
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggle } = useTheme();
  const dark = mode === 'dark';

  const selectMenu = (key: string) => {
    if (key.startsWith('/')) navigate(key);
  };

  return (
    <Layout hasSider={isWide} className="min-h-screen">
      {isWide && (
        <Layout.Sider collapsed={collapsed} classNames={{ root: 'sticky top-0 h-screen' }}>
          <Sidebar
            ariaLabel="Sidebar ${ctx.pascal}"
            brand={
              <div className="flex items-center gap-2 px-1">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-label font-bold text-white">${ctx.pascal.charAt(0)}</span>
                <span className="whitespace-nowrap text-body font-semibold text-ink">${ctx.pascal}</span>
              </div>
            }
            footer={
              <div className="flex items-center gap-2 px-2">
                <Switch size="small" checked={dark} onChange={toggle} aria-label="Dark mode" />
                <span className="whitespace-nowrap text-meta text-ink3">Dark mode</span>
              </div>
            }
            onToggle={setCollapsed}
          >
            <Menu items={MENU_MAIN} mode="vertical" selectedKey={location.pathname} onSelect={selectMenu} />
          </Sidebar>
        </Layout.Sider>
      )}
      <Layout>
        <Layout.Header sticky classNames={{ root: 'pr-4 md:pr-6' }}>
          <div className="flex items-center gap-3">
            <span className="text-body font-semibold text-ink">${ctx.pascal}</span>
            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? 'Tắt dark mode' : 'Bật dark mode'}
              className="ml-auto cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-ink2 hover:bg-s3"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </Layout.Header>
        <Layout.Content classNames={{ root: 'p-4 md:p-6' }}>
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </Layout.Content>
        <Layout.Footer>© 2026 ${ctx.pascal}</Layout.Footer>
      </Layout>
    </Layout>
  );
}
`;
};

const homeTsx = (ctx) =>
  `// Home — trang đầu: Card tối giản chứng minh ui-kit import được + dark ăn theo.
// Thay bằng nội dung thật; thêm trang mới bằng pnpm gen:feature <tên> --app ${ctx.name}.
import { Card } from '@wakii/ui-kit';

export function Home() {
  return (
    <Card title="${ctx.pascal}">
      <p className="m-0 text-label text-ink2">
        Khung sinh bởi <code>pnpm gen:app ${ctx.name}</code> — Layout kit + dark toggle sẵn.
        Thêm route mới bằng <code>pnpm gen:feature &lt;tên&gt; --app ${ctx.name}</code>.
      </p>
    </Card>
  );
}
`;

const appTsx = (ctx) =>
  `// App — routing. ThemeProvider bọc toàn app; AppRoutes tách riêng để test render
// với MemoryRouter (pattern app/admin). Marker GEN:routes — gen-feature chèn route
// mới tại marker (hoặc trước catch-all) khi chạy với --app ${ctx.name}.
import { BrowserRouter, Route, Routes } from 'react-router';
import { AppLayout } from './layout/AppLayout.js';
import { ThemeProvider } from './theme.js';
import { Home } from './pages/Home.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        {/* GEN:routes */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
`;

const appTestTsx = (ctx) =>
  `// Smoke — layout + route đầu render được (jsdom, MemoryRouter).
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppRoutes } from './App.js';
import { ThemeProvider } from './theme.js';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('${ctx.name} app', () => {
  it('render Home qua AppLayout + sidebar brand', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByText('${ctx.pascal}')).toBeInTheDocument();
    expect(screen.getByText(/gen:app/)).toBeInTheDocument();
  });
});
`;

const readmeMd = (ctx) =>
  `# ${ctx.pascal} (${ctx.name}) — SPA

Sinh bởi \`scripts/generators/gen-app.mjs\` (không --remote = dev-only, KHÔNG vào compose/nginx — pattern app/admin).

| Hạng mục | Giá trị |
|---|---|
| Dev | \`pnpm --filter ${ctx.name} dev\` → http://localhost:${ctx.port} |
| UI | \`@wakii/ui-kit\` workspace:* + Layout kit + dark toggle persist |
| Test | \`pnpm --filter ${ctx.name} test\` (vitest jsdom) |

## Việc tiếp theo (AI directives)

1. Thêm trang: \`pnpm gen:feature <tên> --app ${ctx.name}\` — sinh Page/api/test + chèn route.
2. Thêm menu item tương ứng ở \`src/layout/AppLayout.tsx\` (marker GEN:menu).
3. Nếu app cần gọi API BE: đọc \`app/shared\` (api-client/error-envelope — READ-LOCKED, consume không sửa).
`;

export function appSpaFiles(ctx) {
  return {
    'package.json': JSON.stringify(pkg(ctx), null, 2) + '\n',
    'vite.config.ts': viteConfig(ctx),
    'tsconfig.json': tsconfig,
    'vitest.config.ts': vitestConfig,
    'index.html': indexHtml(ctx),
    'src/main.tsx': mainTsx(ctx),
    'src/styles.css': stylesCss,
    'src/theme.tsx': themeTsx(ctx),
    'src/layout/AppLayout.tsx': layoutTsx(ctx),
    'src/pages/Home.tsx': homeTsx(ctx),
    'src/App.tsx': appTsx(ctx),
    'src/App.test.tsx': appTestTsx(ctx),
    'src/tests/setup.ts': setupTs,
    'README.md': readmeMd(ctx),
  };
}
