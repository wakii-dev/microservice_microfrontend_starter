// ESLint flat config — ui-kit (batch ⑭ worker B, chuẩn bị publish npm).
// Chính sách: guard code mới/sửa mới; legacy KHÔNG auto-fix (script lint không --fix),
// vi phạm cũ chỉ 'warn' — đổi dần thành error khi worker chạm tới file. Target: 0 error.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // generated/heavy output — không lint
  { ignores: ['dist/**', 'storybook-static/**', 'coverage/**', 'node_modules/**', '.changeset/**'] },
  // Directive disable tham chiếu rule chưa cài (prettier/prettier trong icons/index.tsx —
  // file sinh bằng script của worker khác, không sửa ngoài story) → tắt báo cáo; plugin
  // prettier không thuộc plan lint của ui-kit
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  // typescript-eslint recommended (flat)
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      // Đăng ký tường minh (react-hooks v7 configs.recommended vẫn eslintrc-shape → lỗi flat)
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // react-hooks — rules-of-hooks giữ ERROR cho component thật (0 vi phạm hiện tại)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Story/stories export component + demo helper — chỉ cảnh báo
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Legacy tolerance — warn thay error (spec batch ⑭: no-unused-vars off→warn)
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Pattern legacy của repo — @ts-nocheck trên peer-lazy (schedule/editor/chart),
      // expression-statement (`flag && fn()`), let chưa gán lại: demote, không auto-fix
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    // Stories: hook trong render-callback CSF3 là pattern hợp lệ — rules-of-hooks chỉ warn
    files: ['**/*.stories.tsx', '**/*.test.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
);
