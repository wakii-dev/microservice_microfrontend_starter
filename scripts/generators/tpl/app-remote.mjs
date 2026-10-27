// app-remote.mjs — template MF remote Rspack (gen-app --remote).
// Mirror app/remotes/tasks (READ-LOCKED pins — KHÔNG đổi react/rspack/mf-enhanced
// nếu không re-spike qua app/spike): 2 entry (index = async boundary RUNTIME-006,
// standalone = debug tĩnh), shared singletons requiredVersion:false + eager:true,
// nginx static + Dockerfile repo-root context (conventions/01 rule 7).
// ctx: { name, camel, pascal, scream, port, date }.

function pkg(ctx) {
  return {
    name: `@wakii/remote-${ctx.name}`,
    version: '0.1.0',
    private: true,
    description: `FE remote \`${ctx.name}\` — MF remote expose ./${ctx.pascal}Page. Sinh bởi scripts/generators gen-app --remote (pattern app/remotes/tasks).`,
    type: 'module',
    scripts: {
      dev: 'rspack serve',
      build: 'rspack build',
      test: 'vitest run',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@tanstack/react-query': 'catalog:',
      '@wakii/fe-shared': 'workspace:*',
      '@wakii/ui-kit': 'workspace:*',
      react: 'catalog:',
      'react-dom': 'catalog:',
    },
    devDependencies: {
      '@module-federation/enhanced': 'catalog:',
      '@rspack/cli': '1.7.12',
      '@rspack/core': 'catalog:',
      '@tailwindcss/postcss': '^4.3.3',
      '@testing-library/jest-dom': '6.9.0',
      '@testing-library/react': '16.3.0',
      '@types/react': '19.2.2',
      '@types/react-dom': '19.2.3',
      jsdom: '27.0.0',
      'postcss-loader': '^8.2.1',
      typescript: '^5.7.0',
      vitest: '3.2.4',
    },
    engines: { node: '>=22' },
  };
}

function rspackConfig(ctx) {
  return `import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { DefinePlugin, HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Remote \`${ctx.name}\` — MF REMOTE (sinh ${ctx.date} — gen-app --remote, mirror app/remotes/tasks).
 * Expose ./${ctx.pascal}Page — load vào shell slot (registry conventions/08; ĐỔI tên/expose
 * = breaking, phải đồng bộ conventions/08 + shell). Port dev ${ctx.port} (conventions/05).
 * Pin matrix theo app/shared mfToolkit (react 19.3.0 / rspack 1.7.12 / mf-enhanced 0.21.6
 * — nâng cấp = re-spike qua app/spike).
 *
 * Env build-time (conventions/06 — KHÔNG hardcode):
 *   API_BASE_URL — base gọi API. Dev native: '' + dev-server proxy /api (dưới đây).
 *     Prod (qua gateway): '' (same-origin).
 *   REMOTE_PUBLIC_PATH — publicPath chunk. Dev: http://localhost:${ctx.port}/ ;
 *     Prod: /remotes/${ctx.name}/ (relative qua gateway, conventions/08).
 */
const isDev = process.env.NODE_ENV !== 'production';

const apiBaseUrl = process.env.API_BASE_URL ?? '';
const publicPath = process.env.REMOTE_PUBLIC_PATH || (isDev ? 'http://localhost:${ctx.port}/' : '/remotes/${ctx.name}/');

export default {
  // 2 entries (BUG-1 sf-5b — pattern tasks): \`index\` = async boundary cho MF container
  // (remoteEntry.js — RUNTIME-006: entry tĩnh shared → loadShareSync trước share init →
  // crash in-shell); \`standalone\` = entry STATIC debug :${ctx.port} — bundle sync toàn bộ,
  // không sinh async chunk cho shared. index.html chỉ inject \`standalone\`.
  entry: {
    index: './src/index.tsx',
    standalone: './src/standalone.tsx',
  },
  output: {
    publicPath,
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    cssFilename: isDev ? '[name].css' : '[name].[contenthash].css',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    // fe-shared (READ-ONLY) import kiểu NodeNext: './x.js' chỉ tới file .ts
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
    },
    // fe-shared src/ui import 'react' nhưng package KHÔNG khai báo dep — resolve qua
    // node_modules của consumer (pattern tasks — singleton giữ 1 bản runtime).
    modules: [path.resolve(rootDir, 'node_modules'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\\.css$/,
        // Tailwind v4 qua postcss — mirror shell/tasks
        type: 'css',
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: { '@tailwindcss/postcss': {} },
              },
            },
          },
        ],
      },
      {
        test: /\\.tsx?$/,
        // fe-shared là package TS raw (main: ./src/index.ts) — bundler compile luôn
        include: [path.resolve(rootDir, 'src'), /[\\\\/]app[\\\\/](shared|ui-kit)[\\\\/]src/],
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: { react: { runtime: 'automatic' } },
              target: 'es2022',
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  plugins: [
    // index.html chỉ dùng cho standalone debug (:${ctx.port}) — inject CHỈ entry standalone
    new HtmlRspackPlugin({
      template: './index.html',
      chunks: ['standalone'],
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    }),
    new ModuleFederationPlugin({
      name: '${ctx.name}',
      filename: 'remoteEntry.js',
      exposes: {
        './${ctx.pascal}Page': './src/${ctx.pascal}Page.tsx',
      },
      // Singleton theo pin matrix — requiredVersion: false (deps "catalog:" bị mf-enhanced
      // infer nhầm); eager: true (BUG-1 sf-5b — prod chunk id stale). Pattern tasks.
      shared: {
        react: { singleton: true, requiredVersion: false, eager: true },
        'react-dom': { singleton: true, requiredVersion: false, eager: true },
        'react/jsx-runtime': { singleton: true, requiredVersion: false, eager: true },
        // PHẢI share đối xứng với shell — thiếu = context tách khỏi QueryClientProvider
        // host → "No QueryClient set" khi mount in-shell (bài học 2026-10-23).
        '@tanstack/react-query': { singleton: true, requiredVersion: false, eager: true },
      },
    }),
  ],
  experiments: {
    css: true,
  },
  devServer: {
    port: Number(process.env.REMOTE_${ctx.scream}_PORT || ${ctx.port}),
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: true,
    // DEV-ONLY proxy (pattern tasks): chạy dev với API_BASE_URL='' là qua proxy này.
    proxy: [
      {
        context: ['/api'],
        target: \`http://localhost:\${process.env.NODE_SVC_PORT || 3001}\`,
      },
    ],
  },
};
`;
}

const indexHtml = (ctx) =>
  `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Remote: ${ctx.name} (standalone debug)</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const indexTsx = (ctx) => `// MF container entry — async boundary BẮT BUỘC (RUNTIME-006, pattern tasks):
// entry KHÔNG được import shared tĩnh — share scope phải init xong trước. Shell
// import expose './${ctx.pascal}Page' qua entry này; standalone KHÔNG chạy khi in-shell.
import('./standalone').catch((err: unknown) => {
  // Chunk/CSS load fail → root trống im lặng — hiển thị ra luôn
  document.body.textContent = \`Standalone load fail: \${err instanceof Error ? err.message : String(err)}\`;
});
`;

function standaloneTsx(ctx) {
  return `// Standalone render (tách khỏi index.tsx — async boundary RUNTIME-006). CHỈ để debug
// remote đứng mình (:${ctx.port}). In-shell: shell làm chủ global styles/providers.
import '@wakii/ui-kit/styles/tokens.css';
import '@wakii/ui-kit/styles/base.css';
import './app.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ${ctx.pascal}Page } from './${ctx.pascal}Page';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root không tồn tại trong index.html');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

createRoot(container).render(
  // standalone không có host provider — tự wrap (in-shell thì shell cấp, singleton share)
  <StrictMode>
    <aside className="m-4 max-w-[720px] rounded-2 border border-line border-l-[3px] border-l-accent bg-s2 p-3 px-4 text-label text-ink2">
      <strong className="font-mono text-ink">Standalone debug — remote \`${ctx.name}\`</strong>
      <p className="mt-1">
        UI thật chạy trong shell (compose :8080, dev :3000). Thêm slot cho remote này trong
        app/shell (Route + RemoteSlot + NavBar — registry conventions/08).
      </p>
    </aside>
    <QueryClientProvider client={queryClient}>
      <${ctx.pascal}Page />
    </QueryClientProvider>
  </StrictMode>,
);
`;
}

const appCss = (ctx) => `/* Tailwind v4 entry của remote ${ctx.name} — pattern app/remotes/tasks (đã nghiệm chứng):
 * import theme + utilities từ ui-kit; @source qua node_modules symlink (path repo-relative
 * bị tailwind ignore qua symlink — chỉ explicit node_modules path được scan). */
@import '@wakii/ui-kit/styles/tailwind.css';

@source './';
@source '../node_modules/@wakii/ui-kit/src';
`;

const envDts = `// Build-time env inject bởi rspack DefinePlugin (conventions/06 — không hardcode)
declare const __API_BASE_URL__: string;
// CSS side-effect import (fe-shared tokens/base — rspack experiments.css); defensive
declare module '*.css';
`;

const tsconfig = (ctx) =>
  `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": {
      "react": ["node_modules/@types/react"],
      "react/jsx-runtime": ["node_modules/@types/react/jsx-runtime"]
    }
  },
  "include": ["src", "tests", "vitest.config.ts"]
}
`;

function vitestConfig(ctx) {
  return `import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Stub build-time env (rspack DefinePlugin) cho unit test — test mock fetch nên base rỗng
  define: {
    __API_BASE_URL__: "''",
  },
  resolve: {
    // fe-shared src/ui import 'react' nhưng package không khai báo dep — vitest resolve
    // từ file fe-shared không thấy react của package này. Alias về node_modules local
    // (pattern app/remotes/tasks/vitest.config.ts).
    alias: {
      react: path.resolve(rootDir, 'node_modules/react'),
      'react-dom': path.resolve(rootDir, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(rootDir, 'node_modules/react/jsx-runtime'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
`;
}

const setupTs = `import '@testing-library/jest-dom/vitest';

// jsdom không có matchMedia — kit useMediaQuery cần (stub reduced-motion, pattern tasks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
`;

function pageTsx(ctx) {
  return `// ${ctx.pascal}Page — khung SAMPLE: Card + Table từ @wakii/ui-kit với mock data.
// Thay bằng dữ liệu thật: dùng @wakii/fe-shared (api-client/error-envelope —
// READ-LOCKED, consume không sửa) + react-query (đã share singleton với shell).
// In-shell: QueryClientProvider do shell cấp (singleton) — KHÔNG tự wrap ở đây.
import { Card, Table, Tag, type TableColumn } from '@wakii/ui-kit';

interface SampleRow {
  id: string;
  name: string;
  state: 'sample';
}

const SAMPLE_ROWS: SampleRow[] = [
  { id: 's-1', name: 'dòng mẫu 1', state: 'sample' },
  { id: 's-2', name: 'dòng mẫu 2', state: 'sample' },
];

const columns: TableColumn<SampleRow>[] = [
  { key: 'id', title: 'ID', width: '120px' },
  { key: 'name', title: 'Tên' },
  {
    key: 'state',
    title: 'Trạng thái',
    render: () => <Tag>SAMPLE</Tag>,
  },
];

export function ${ctx.pascal}Page() {
  return (
    <Card title="${ctx.pascal}" extra={<Tag>MF remote — gen-app --remote</Tag>}>
      <Table<SampleRow>
        columns={columns}
        dataSource={SAMPLE_ROWS}
        rowKey="id"
        striped
        size="small"
      />
    </Card>
  );
}
`;
}

const pageTestTsx = (ctx) =>
  `// Smoke — Page render Table với sample rows (jsdom; không cần provider vì Page
// chưa dùng react-query — khi thêm useQuery, bọc QueryClientProvider ở đây).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ${ctx.pascal}Page } from '../src/${ctx.pascal}Page';

afterEach(() => {
  cleanup();
});

describe('${ctx.pascal}Page', () => {
  it('render title + sample rows', () => {
    render(<${ctx.pascal}Page />);
    expect(screen.getByText('${ctx.pascal}')).toBeInTheDocument();
    expect(screen.getByText('dòng mẫu 1')).toBeInTheDocument();
  });
});
`;

function nginxConf(ctx) {
  return `# Remote \`${ctx.name}\` static — port cố định ${ctx.port} trong container (conventions/05,
# gateway /remotes/${ctx.name}/ strip-prefix chung — conventions/08). Sinh bởi gen-app --remote.
server {
  listen ${ctx.port};
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Security headers baseline — pattern remote-tasks
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # remoteEntry.js — shell fetch mỗi lần boot; KHÔNG cache aggressive
  location = /remoteEntry.js {
    add_header Cache-Control "no-cache";
  }

  # Static asset — contenthash cache lâu
  location /assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  # Standalone :${ctx.port} — index.html + runtime chunk fetch publicPath gateway-shaped
  # (/remotes/${ctx.name}/main.*.js — compile-time) → map prefix về root, cùng 1 dist
  # phục vụ cả 2 đường (pattern remote-tasks, BUG-1 sf-5b).
  location /remotes/${ctx.name}/ {
    alias /usr/share/nginx/html/;
  }

  # Standalone debug index — không router nên fallback đơn giản
  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;
}

function dockerfile(ctx) {
  return `# Remote \`${ctx.name}\` — MF remote static. Sinh bởi gen-app --remote. Multi-stage theo
# platform/conventions/01-dockerfile-pattern.md. Build context = repo ROOT (compose:
# context .., dockerfile app/remotes/${ctx.name}/Dockerfile) — cần app/shared (workspace
# dep TS raw) + pnpm-workspace.yaml + root lockfile.
#
# ⚠️ COPY đủ MỌI importer trong pnpm-lock.yaml — THÊM importer mới khi repo thêm
# package mới, thiếu importer nào frozen-lockfile cũng fail (pattern remote-tasks).

# build stage — cài + build rspack
FROM node:22-alpine AS build
WORKDIR /repo
# Pin pnpm 9.15.9 = dev machine + lockfileVersion (corepack default tải pnpm mới — lệch format)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY app/shared/package.json app/shared/
COPY app/ui-kit/package.json app/ui-kit/
COPY app/spike/host/package.json app/spike/host/
COPY app/spike/remote/package.json app/spike/remote/
COPY app/shell/package.json app/shell/
COPY app/remotes/tasks/package.json app/remotes/tasks/
COPY app/remotes/activity/package.json app/remotes/activity/
COPY app/remotes/${ctx.name}/package.json app/remotes/${ctx.name}/
RUN pnpm install --frozen-lockfile --filter @wakii/remote-${ctx.name}...
COPY app/shared app/shared
COPY app/ui-kit app/ui-kit
COPY app/remotes/${ctx.name} app/remotes/${ctx.name}
# Build-time env (conventions/06+08): prod API base = '' (same-origin qua gateway),
# publicPath = /remotes/${ctx.name}/ (gateway /remotes/<name>/)
ENV API_BASE_URL="" \\
    REMOTE_PUBLIC_PATH="/remotes/${ctx.name}/" \\
    NODE_ENV=production
RUN pnpm --filter @wakii/remote-${ctx.name} build

# runtime stage — nginx serve static, port cố định ${ctx.port} (conventions/05)
# Healthcheck KHÔNG khai ở đây (conventions/01 rule 4 — một nguồn duy nhất: compose)
FROM nginx:1.27-alpine AS runtime
COPY app/remotes/${ctx.name}/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/app/remotes/${ctx.name}/dist /usr/share/nginx/html
EXPOSE ${ctx.port}
`;
}

function readmeMd(ctx) {
  return `# Remote \`${ctx.name}\` (@wakii/remote-${ctx.name})

Sinh bởi \`scripts/generators/gen-app.mjs --remote\` — MF remote expose \`./${ctx.pascal}Page\` (pattern app/remotes/tasks).

| Hạng mục | Giá trị |
|---|---|
| Dev | \`pnpm --filter @wakii/remote-${ctx.name} dev\` → http://localhost:${ctx.port} (standalone debug) |
| Prod | gateway \`/remotes/${ctx.name}/\` — remoteEntry.js cho shell |
| Pin | react/rspack/mf-enhanced theo mfToolkit — nâng cấp = re-spike (READ-LOCKED rules) |

## Việc tiếp theo (AI directives)

1. \`pnpm install\` (root) — cập nhật pnpm-lock.yaml importer mới + Dockerfile frozen-lockfile.
2. \`pnpm --filter @wakii/remote-${ctx.name} test && pnpm --filter @wakii/remote-${ctx.name} typecheck\`.
3. Shell slot: thêm Route + RemoteSlot + NavBar trong app/shell (registry conventions/08):
   path \`/${ctx.name}\`, remote name \`${ctx.name}\`, module \`./${ctx.pascal}Page\`.
4. \`platform/.env.example\`: đã có REMOTE_${ctx.scream}_PORT + REMOTE_${ctx.scream}_URL (gen-app thêm).
5. API thật: dùng fe-shared api-client + react-query (singleton share với shell).
`;
}

export function appRemoteFiles(ctx) {
  return {
    'package.json': JSON.stringify(pkg(ctx), null, 2) + '\n',
    'rspack.config.mjs': rspackConfig(ctx),
    'index.html': indexHtml(ctx),
    'src/index.tsx': indexTsx(ctx),
    'src/standalone.tsx': standaloneTsx(ctx),
    'src/app.css': appCss(ctx),
    'src/env.d.ts': envDts,
    'tsconfig.json': tsconfig(ctx),
    'vitest.config.ts': vitestConfig(ctx),
    'tests/setup.ts': setupTs,
    [`tests/${ctx.pascal}Page.test.tsx`]: pageTestTsx(ctx),
    [`src/${ctx.pascal}Page.tsx`]: pageTsx(ctx),
    'nginx.conf': nginxConf(ctx),
    Dockerfile: dockerfile(ctx),
    'README.md': readmeMd(ctx),
  };
}
