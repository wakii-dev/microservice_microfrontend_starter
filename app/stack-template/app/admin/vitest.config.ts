// Vitest — admin tests (routing render + form zod). jsdom + globals, cùng pattern ui-kit.
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
