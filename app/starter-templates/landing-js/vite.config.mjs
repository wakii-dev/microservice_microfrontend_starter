// Vite config — React SPA + Tailwind v4 qua @tailwindcss/vite + alias `@/` →
// src/ (đồng bộ 3 chỗ: jsconfig.json paths + vitest.config.mjs + đây).
// Bản JS của vite.config.ts — config thuần, không types.
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
