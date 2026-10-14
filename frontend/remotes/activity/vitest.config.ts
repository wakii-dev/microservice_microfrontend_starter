import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Stub build-time env (rspack DefinePlugin) cho unit test — test mock fetch nên base rỗng
  define: {
    __API_BASE_URL__: "''",
  },
  resolve: {
    // SF-4 (story VU-53): test giờ render primitives fe-shared (JSX) — cùng pattern shell
    // vitest.config.ts (SF-1): fe-shared không khai báo dep react (giữ pnpm-lock.yaml),
    // alias về node_modules của activity (catalog 19.3.0 pinned giống hệt ×3 package).
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
  },
});
