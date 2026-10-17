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
    // Pin TZ cho toàn bộ test run — tests timeline nhóm ngày + vi-VN pin theo giờ
    // Việt Nam (review P1: không pin = fail deterministic trên máy TZ ≤ UTC-3, vì
    // mốc "Hôm qua"/ngày khác lệch ranh giới ngày local). Node re-read TZ per Date
    // call nên có hiệu lực ngay với worker process.
    env: { TZ: 'Asia/Ho_Chi_Minh' },
  },
});
