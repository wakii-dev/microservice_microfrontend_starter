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
    // fe-shared src/ui (SF-1) import 'react' nhưng package không khai báo dep (giữ
    // pnpm-lock.yaml) — vitest resolve từ file fe-shared không thấy react của tasks.
    // Alias về node_modules của tasks: catalog 19.3.0 pinned giống hệt ×3 package.
    // (Cùng cấu hình shell/vitest.config.ts — SF-3 render primitives lần đầu trong tests.)
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
