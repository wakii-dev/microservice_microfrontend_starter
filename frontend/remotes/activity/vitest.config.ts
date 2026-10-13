import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Stub build-time env (rspack DefinePlugin) cho unit test — test mock fetch nên base rỗng
  define: {
    __API_BASE_URL__: "''",
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
