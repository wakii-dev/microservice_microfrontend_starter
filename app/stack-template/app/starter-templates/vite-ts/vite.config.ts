// Vite config — copy pattern app/admin (batch ⑦, đã nghiệm chứng): React SPA +
// Tailwind v4 qua @tailwindcss/vite. Theme/utilities đến từ
// @wakii/ui-kit/styles/tailwind.css (được import trong src/styles.css).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
