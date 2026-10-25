// Vitest — engine CLI test Node thuần (fs tmp thật, KHÔNG network, KHÔNG DOM).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
