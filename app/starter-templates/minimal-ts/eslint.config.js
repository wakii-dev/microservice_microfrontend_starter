// ESLint flat config — base typescript-eslint + react-hooks/react-refresh
// (chuẩn nhà, mirror app/ui-kit) + eslint-plugin-boundaries enforce Kiến trúc
// được mô tả trong AGENTS.md: ai được import ai, vi phạm = lỗi lint chặn commit.
// Chạy: pnpm lint
import boundaries from 'eslint-plugin-boundaries';
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
      boundaries,
    },
    settings: {
      // Resolve alias @/ cho boundaries — không có resolver, import alias không
      // resolve được → bị coi external → luật kiến trúc bị bỏ qua (đã nghiệm
      // chứng: thiếu setting này thì mọi vi phạm qua alias đều lọt).
      'import/resolver': {
        alias: { map: [['@', './src']], extensions: ['.ts', '.tsx', '.js', '.mjs', '.jsx'] },
      },
      // Phân loại 2 lớp: file đơn lẻ (entry/env) qua category 'boundaries/files',
      // thư mục qua element type 'boundaries/elements'.
      'boundaries/files': [
        { pattern: 'src/main.tsx', category: 'entry' },
        { pattern: 'src/env.ts', category: 'env' },
      ],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'routes', pattern: 'src/routes/**' },
        { type: 'shared-ui', pattern: 'src/shared/ui/**' },
        { type: 'shared-lib', pattern: 'src/shared/lib/**' },
      ],
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // ── Luật kiến trúc (bảng đầy đủ trong AGENTS.md) ──
      // entry chỉ wire app · app điều phối routes + shared · routes + shared-ui
      // KHÔNG bao giờ import ngược lên app. shared phải giữ "nguội" (không biết
      // gì về routes/app) để còn tái sử dụng. Policy không liệt kê = disallow
      // (default) — vd routes→app tự vi phạm.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: '{{from.element.types.[0]}} không được import {{to.element.types.[0]}} — xem bảng luật import trong AGENTS.md',
          policies: [
            // entry (src/main.tsx — category) chỉ được wire app
            {
              from: { file: { categories: 'entry' } },
              allow: [{ to: { element: { type: 'app' } } }],
              message: 'main.tsx (entry) chỉ được wire src/app — không import trực tiếp routes/shared',
            },
            {
              from: { element: { type: 'app' } },
              allow: [
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'routes' } } },
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
                { to: { file: { categories: 'env' } } },
              ],
            },
            {
              from: { element: { type: 'routes' } },
              allow: [
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
              ],
            },
            { from: { element: { type: 'shared-ui' } }, allow: [{ to: { element: { type: 'shared-lib' } } }] },
          ],
        },
      ],
    },
  },
  {
    // Test được import tự do (fixture/cả nội bộ) — tắt luật kiến trúc cho test
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'boundaries/dependencies': 'off',
    },
  },
);
