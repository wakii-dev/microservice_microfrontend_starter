import { defineConfig } from 'vitest/config';

// ui-kit test đứng riêng — react/@types có trong devDependencies (chỉ phục vụ test,
// runtime vẫn "consumer cung cấp" qua source-consumption) nên không cần alias như shell.
export default defineConfig({
  esbuild: {
    // JSX primitives compile automatic runtime — không thì esbuild rơi về
    // classic "React.createElement" → "React is not defined" lúc render
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx'], // test colocated không pha loãng coverage // stories không chạy trong vitest — pha loãng số liệu
      thresholds: { lines: 85, statements: 85, functions: 90, branches: 90 },
    },
  },
});
