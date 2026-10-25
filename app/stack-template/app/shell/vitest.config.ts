import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
    coverage: {
      provider: 'v8',
      include: ['src/**'], // config/stories ngoài scope test
      // ngưỡng = hiện trạng −headroom — chống coverage rơi tự do (chỉ tiêu duyệt 2026-10-17)
      thresholds: { lines: 90, statements: 90, functions: 80, branches: 90 },
    },
  },
});
