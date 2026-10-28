// ESLint flat config — bản JS của landing-ts: @eslint/js recommended +
// react-hooks/react-refresh (chuẩn nhà, mirror app/ui-kit; KHÔNG typescript-eslint
// vì template JS không type-check). Landing là 1 trang đơn — không có tầng
// app/routes/features để enforce, nên KHÔNG cần eslint-plugin-boundaries
// (khác minimal). Chạy: pnpm lint
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      // Đăng ký tường minh (react-hooks v7 configs.recommended vẫn eslintrc-shape → lỗi flat)
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // ESLint core KHÔNG track JSX tag như usage — bỏ qua biến viết hoa
      // (component) để no-unused-vars không báo giả (create-vite cùng pattern).
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
    },
  },
];
