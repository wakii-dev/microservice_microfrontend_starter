// Astro minimal + React islands + Tailwind v4 qua Vite plugin — pattern đã
// spike-verify: integrations [react()] + vite.plugins [tailwindcss()].
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
