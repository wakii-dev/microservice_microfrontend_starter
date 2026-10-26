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
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'public/**'] },
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
        // index.ts của feature là file (không thư mục) → phân loại bằng category
        { pattern: 'src/features/*/index.ts', category: 'feature-entry' },
      ],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'routes', pattern: 'src/routes/**' },
        { type: 'feature-ui', pattern: 'src/features/*/ui/**' },
        { type: 'feature-containers', pattern: 'src/features/*/containers/**' },
        { type: 'feature-hooks', pattern: 'src/features/*/hooks/**' },
        { type: 'feature-api', pattern: 'src/features/*/api/**' },
        { type: 'feature-schema', pattern: 'src/features/*/schema/**' },
        { type: 'shared-api', pattern: 'src/shared/api/**' },
        { type: 'shared-ui', pattern: 'src/shared/ui/**' },
        { type: 'shared-lib', pattern: 'src/shared/lib/**' },
        { type: 'mocks', pattern: 'src/mocks/**' },
      ],
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // ── Luật kiến trúc (bảng đầy đủ trong AGENTS.md) ──
      // Luồng phụ thuộc 1 chiều: routes → feature-entry → containers →
      // (hooks → api) → ui/schema. UI không tự fetch (cấm ui→api/hooks);
      // api thuần TS (cấm react); shared "nguội"; routes không import lách
      // vào trong feature — chỉ qua index. Policy không liệt kê = disallow.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message: '{{from.element.types.[0]}} không được import {{to.element.types.[0]}} — xem bảng luật import trong AGENTS.md',
          policies: [
            // entry (src/main.tsx — category) chỉ wire app + bật MSW trong dev
            {
              from: { file: { categories: 'entry' } },
              allow: [
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'mocks' } } },
              ],
              message: 'main.tsx (entry) chỉ được wire src/app (+ mocks trong dev)',
            },
            {
              from: { element: { type: 'app' } },
              allow: [
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'routes' } } },
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
                { to: { element: { type: 'shared-api' } } },
                { to: { file: { categories: 'env' } } },
              ],
            },
            {
              // Route chỉ import feature qua index — không lách vào ui/hooks/api.
              // routes→routes cho phép: trang dùng layout chung đặt trong routes/.
              from: { element: { type: 'routes' } },
              allow: [
                { to: { element: { type: 'routes' } } },
                { to: { file: { categories: 'feature-entry' } } },
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
              ],
              message: 'routes chỉ được import feature qua features/*/index.ts',
            },
            {
              // index (category) export containers + ui — cửa vào duy nhất feature
              from: { file: { categories: 'feature-entry' } },
              allow: [
                { to: { element: { type: 'feature-ui' } } },
                { to: { element: { type: 'feature-containers' } } },
                { to: { element: { type: 'feature-hooks' } } },
                { to: { element: { type: 'feature-api' } } },
                { to: { element: { type: 'feature-schema' } } },
              ],
            },
            {
              // UI thuần — cấm containers/hooks/api (data layer thuộc container)
              from: { element: { type: 'feature-ui' } },
              allow: [
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
                { to: { element: { type: 'feature-schema' } } },
              ],
              message: 'ui/ là presentational — cấm import containers|hooks|api (data do container bơm qua props)',
            },
            {
              from: { element: { type: 'feature-containers' } },
              allow: [
                { to: { element: { type: 'feature-ui' } } },
                { to: { element: { type: 'feature-hooks' } } },
                { to: { element: { type: 'feature-api' } } },
                { to: { element: { type: 'feature-schema' } } },
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
              ],
            },
            {
              // hooks cấm ui — hook không render
              from: { element: { type: 'feature-hooks' } },
              allow: [
                { to: { element: { type: 'feature-api' } } },
                { to: { element: { type: 'feature-schema' } } },
                { to: { element: { type: 'shared-api' } } },
                { to: { element: { type: 'shared-lib' } } },
              ],
              message: 'hooks/ cấm import ui/ — hook trả data/state, render là việc của ui',
            },
            {
              from: { element: { type: 'feature-api' } },
              allow: [
                { to: { element: { type: 'feature-schema' } } },
                { to: { element: { type: 'shared-api' } } },
                { to: { element: { type: 'shared-lib' } } },
                { to: { file: { categories: 'env' } } },
              ],
            },
            {
              from: { element: { type: 'feature-schema' } },
              allow: [{ to: { element: { type: 'shared-lib' } } }],
            },
            {
              from: { element: { type: 'shared-api' } },
              allow: [
                { to: { element: { type: 'shared-lib' } } },
                { to: { file: { categories: 'env' } } },
              ],
            },
            {
              from: { element: { type: 'shared-ui' } },
              allow: [{ to: { element: { type: 'shared-lib' } } }],
            },
            {
              // mocks mô phỏng backend — trả data THÔ, không import schema app
              from: { element: { type: 'mocks' } },
              allow: [{ to: { element: { type: 'mocks' } } }],
            },
          ],
        },
      ],
    },
  },
  {
    // api/ là tầng thuần TS (fetch + zod) — cấm react/react-dom ở CẢ feature
    // api lẫn shared/api
    files: ['src/features/*/api/**', 'src/shared/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message: 'api/ là tầng thuần TS — cấm react (UI render ở ui/, state ở hooks/)',
            },
          ],
        },
      ],
    },
  },
  {
    // Test được import tự do (fixture/mock cả nội bộ) — tắt luật kiến trúc
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'boundaries/dependencies': 'off',
      'no-restricted-imports': 'off',
    },
  },
);
