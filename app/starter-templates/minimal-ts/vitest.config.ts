// Vitest — jsdom (RTL render component DOM thật) + alias `@/` như vite.config
// + setup file nạp matchers jest-dom. `globals: true` để @testing-library/react
// tự đăng ký cleanup sau mỗi test (không cần viết thủ công).
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
