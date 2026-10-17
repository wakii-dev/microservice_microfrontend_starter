// Vite config — app admin (batch ⑦): React SPA showcase ui-kit, port 5173 (storybook
// ui-kit giữ 6006). Tailwind v4 qua @tailwindcss/vite — theme/utilities đến từ
// ui-kit/styles/tailwind.css (xem src/styles.css: @source qua symlink node_modules).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
