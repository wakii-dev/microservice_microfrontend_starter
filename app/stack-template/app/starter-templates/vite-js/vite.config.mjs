import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Bản JS của vite.config.ts — react + tailwindcss plugins (config thuần, không types).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
