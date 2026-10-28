import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Stub mọi specifier css của swiper ('swiper/css', 'swiper/css/*', 'swiper/*.css'
 * — dist của ui-kit@registry dùng bộ này) về empty module.
 *
 * Vì sao cần (R5 onboarding 2026-10-28): `@wakii/ui-kit/carousel` (registry dist)
 * import 'swiper/css' — vitest externalize node_modules nên NODE ESM tự resolve
 * → "Unknown file extension .css" (4 suite đỏ ngay từ scaffold). Fix 2 lớp:
 *  1. `server.deps.inline` (dưới) — ép ui-kit qua vite transform;
 *  2. plugin resolveId enforce:'pre' — chặn specifier swiper css TRƯỚC import-
 *     analysis (alias string-form không bắt được 'swiper/css/pagination' từ dep
 *     inlined — đã thử, fail); test không cần css thật, jsdom không render swiper.
 * Workspace mode (ui-kit từ source): linked deps vốn đã inline, plugin vẫn no-op
 * nhanh — an toàn cả 2 mode.
 */
function stubSwiperCss(): Plugin {
  const STUB_ID = '\0swiper-css-stub';
  return {
    name: 'stub-swiper-css',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'swiper/css' || id.startsWith('swiper/css/') || /^swiper\/[\w.-]+\.css$/.test(id)) return STUB_ID;
      return null;
    },
    load(id) {
      if (id === STUB_ID) return 'export default {};\n';
      return null;
    },
  };
}

export default defineConfig({
  plugins: [stubSwiperCss()],
  // Stub build-time env (rspack DefinePlugin) cho unit test — test mock fetch nên base rỗng;
  // remote URLs stub giá trị "buildtime" để remote-urls.test khẳng định đường inject
  define: {
    __API_BASE_URL__: "''",
    __REMOTE_TASKS_URL__: "'http://buildtime:4001/remoteEntry.js'",
    __REMOTE_ACTIVITY_URL__: "'http://buildtime:4002/remoteEntry.js'",
  },
  resolve: {
    // fe-shared src/ui (SF-1) import 'react' nhưng package không khai báo dep (giữ
    // pnpm-lock.yaml) — vitest resolve từ file fe-shared không thấy react của shell.
    // Alias về node_modules của shell: catalog 19.3.0 pinned giống hệt ×3 package.
    alias: {
      react: path.resolve(rootDir, 'node_modules/react'),
      'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(rootDir, 'node_modules/react/jsx-runtime'),
    },
  },
  // JSX fe-shared (không tsconfig riêng) phải transform automatic runtime — không thì
  // esbuild rơi về classic "React.createElement" → "React is not defined" lúc render
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        // ui-kit từ REGISTRY (dist) phải đi qua transform — externalized thì node
        // ESM tự import 'swiper/css' → "Unknown file extension .css" (R5 2026-10-28)
        inline: [/@wakii\/ui-kit/],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**'], // config/stories ngoài scope test
      // ngưỡng = hiện trạng −headroom — chống coverage rơi tự do (chỉ tiêu duyệt 2026-10-17)
      thresholds: { lines: 90, statements: 90, functions: 80, branches: 90 },
    },
  },
});
