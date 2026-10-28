// Bản JS của vitest.config.ts — jsdom (RTL render component DOM thật) + setup
// file nạp matchers jest-dom. `globals: true` để @testing-library/react tự đăng
// ký cleanup sau mỗi test. Không alias — template này import relative.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.mjs'],
    css: false,
  },
});
