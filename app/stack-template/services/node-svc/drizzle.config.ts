import { defineConfig } from 'drizzle-kit';

// Migration source-of-truth là SQL file commit trong drizzle/ — generate lại
// chỉ khi schema.ts đổi. CI không chạy generate (chỉ diff-check).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  strict: true,
});
