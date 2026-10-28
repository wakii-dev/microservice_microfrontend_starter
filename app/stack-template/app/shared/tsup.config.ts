// tsup — build dist cho npm publish (mission publish-fe-shared). Workspace VẪN phân phối
// source trực tiếp (exports → ./src/*.ts, ADR-0009 consumed-qua-source); dist CHỈ dùng khi
// publish (scripts/publish-npm.sh rewrite exports sang dist trong TMP — hotfix 0.4.1 pattern
// ui-kit: consumers npm ngoài monorepo không resolve được entry .ts). Entry theo exports map
// (refresh-client không có subpath riêng — bundle theo barrel index). External
// @module-federation/enhanced: consumer tự mang (dependencies) — KHÔNG bundle vào dist.
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'api-client': 'src/api-client.ts',
    'token-storage': 'src/token-storage.ts',
    'error-envelope': 'src/error-envelope.ts',
    'mf-bootstrap': 'src/mf-bootstrap.ts',
  },
  format: ['esm', 'cjs'],
  // splitting FALSE: mỗi entry self-contained — không chunk dùng chung kéo deps ngoài ý muốn
  // (mirror ui-kit; source nhỏ nên duplicate cost không đáng kể)
  splitting: false,
  dts: true,
  sourcemap: true,
  clean: true,
  external: [/^@module-federation\/enhanced($|\/)/],
});
