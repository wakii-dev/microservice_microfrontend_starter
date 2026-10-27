// ESLint flat config — base typescript-eslint + react-hooks/react-refresh
// (chuẩn nhà, mirror app/ui-kit). Landing là 1 trang đơn — không có tầng
// app/routes/features để enforce, nên KHÔNG cần eslint-plugin-boundaries
// (khác minimal/product). Chạy: pnpm lint
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: {
      // Đăng ký tường minh (react-hooks v7 configs.recommended vẫn eslintrc-shape → lỗi flat)
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
