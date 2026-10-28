import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Stub the build-time env (rspack DefinePlugin) for unit tests — the smoke test
  // never touches the network, so an empty API base is correct.
  define: {
    __API_BASE_URL__: "''",
  },
  // JSX must use the automatic runtime, or esbuild falls back to classic
  // React.createElement → "React is not defined" at render.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
