import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { DefinePlugin, HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Remote `tasks` — MF REMOTE (SF-6, FI-74). Expose `./TasksPage` load vào shell slot
 * (registry conventions/08 — ĐỔI tên/expose = breaking, phải đồng bộ conventions/08 + shell).
 * Port dev 4001 (conventions/05). Pin matrix theo app/shared mfToolkit
 * (react 19.3.0 / rspack 1.7.12 / mf-enhanced 0.21.6 — nâng cấp = re-spike).
 *
 * Env build-time (conventions/06 — KHÔNG hardcode):
 *   API_BASE_URL — base gọi API. Dev native: http://localhost:3001 (node-svc trực tiếp,
 *     CORS dev mở — conventions/07). Prod (qua gateway): '' (same-origin).
 *   REMOTE_PUBLIC_PATH — publicPath chunk. Dev: http://localhost:4001/ (absolute —
 *     runtime chunk fetch về đúng origin remote, bài học spike SF-1). Prod: /remotes/tasks/
 *     (relative qua gateway, conventions/08).
 *   REMOTE_TASKS_PORT — port dev server (default 4001, conventions/05).
 */
const isDev = process.env.NODE_ENV !== 'production';

const apiBaseUrl = process.env.API_BASE_URL ?? (isDev ? 'http://localhost:3001' : '');
const publicPath = process.env.REMOTE_PUBLIC_PATH || (isDev ? 'http://localhost:4001/' : '/remotes/tasks/');

export default {
  // 2 entries (BUG-1 sf-5b): `index` = async boundary cho MF container (remoteEntry.js —
  // RUNTIME-006: entry tĩnh shared → loadShareSync trước share init → crash in-shell);
  // `standalone` = entry STATIC cho trang debug :4001 — toàn bộ graph (react eager, CSS,
  // page) bundle sync vào 1 chunk, không sinh async chunk cho shared → loại trừ hẳn lớp
  // lỗi rspack 1.7.12 + mf-enhanced 0.21.6 sinh chunk id stale (phantom "237"/"819") làm
  // import('./standalone') pending vô hạn. index.html chỉ inject `standalone` (2 entry cùng
  // chạy sẽ double-bootstrap cùng #root qua 2 runtime copy).
  entry: {
    index: './src/index.tsx',
    standalone: './src/standalone.tsx',
  },
  output: {
    publicPath,
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    // CSS emit ở ROOT + contenthash prod (cache-busting) — y hệt shell
    cssFilename: isDev ? '[name].css' : '[name].[contenthash].css',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    // fe-shared (READ-ONLY, SF-1) import kiểu NodeNext: './x.js' chỉ tới file .ts
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
    },
    // fe-shared src/ui (SF-1) import 'react' nhưng package KHÔNG khai báo dep
    // (thêm dep = đổi pnpm-lock.yaml — success criteria cấm). Resolve qua
    // node_modules của consumer — react 19.3.0 catalog-pinned giống hệt ×3,
    // MF singleton vẫn giữ 1 bản runtime.
    modules: [path.resolve(rootDir, 'node_modules'), 'node_modules'],
  },
  module: {
    rules: [
      // Copy y hệt shell (SF-1) — remote import CSS fe-shared (standalone tokens+base,
      // primitives sau này) cần css experiment; thiếu rule = build fail trên import .css
      {
        test: /\.css$/,
        // Tailwind v4 qua postcss — mirror shell (spec tailwind-migration P0)
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
        test: /\.tsx?$/,
        // fe-shared là package TS raw (main: ./src/index.ts) — bundler phải compile luôn
        include: [path.resolve(rootDir, 'src'), /[\\/]app[\\/](shared|ui-kit)[\\/]src/],
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
    // index.html chỉ dùng cho standalone debug (:4001) — inject CHỈ entry standalone
    // (entry index chỉ tồn tại làm anchor cho MF container remoteEntry.js, không chạy
    // trong trang — 2 entry cùng chạy = double-bootstrap)
    new HtmlRspackPlugin({
      template: './index.html',
      chunks: ['standalone'],
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    }),
    new ModuleFederationPlugin({
      name: 'tasks',
      filename: 'remoteEntry.js',
      exposes: {
        './TasksPage': './src/TasksPage.tsx',
      },
      // Singleton theo pin matrix — KHÔNG bundle duplicate react (spec slice mục 3;
      // remote consume singleton do shell host cung cấp khi load trong shell).
      // requiredVersion: false — deps ghi "catalog:" (pnpm protocol) bị mf-enhanced infer
      // nhầm thành requiredVersion literal → version-check warning sai against host 19.3.0.
      // Singleton = luôn dùng bản của host, không cần check.
      //
      // eager: true (BUG-1, sf-5b): rspack 1.7.12 + mf-enhanced 0.21.6 build prod sinh
      // data blocks (initializeSharingData/consumesLoadingData) trỏ chunk id stale
      // (phantom "103"/"237" ngoài chunk map) và KHÔNG emit runtime machinery
      // (__webpack_require__.I / .f.consumes là stub throw) — consumer wrapper
      // (706/43/418) không được emit → standalone import('./standalone') pending vô hạn,
      // trang trắng. eager inline shared vào entry chunk, bỏ máy móc consume async.
      // In-shell không đổi: host provide react (singleton loaded-first), bản eager của
      // remote chỉ là fallback không chạy. Dev server không bị (chunking khác).
      shared: {
        react: { singleton: true, requiredVersion: false, eager: true },
        'react-dom': { singleton: true, requiredVersion: false, eager: true },
        // JSX fe-shared compile ra import react/jsx-runtime — thiếu = bundle jsx-runtime
        // riêng → react thứ 2 khi mount trong shell ("Invalid hook call", spike R2 SF-1)
        'react/jsx-runtime': { singleton: true, requiredVersion: false, eager: true },
      },
    }),
  ],
  experiments: {
    css: true,
  },
  devServer: {
    port: Number(process.env.REMOTE_TASKS_PORT || 4001),
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: true,
    // DEV-ONLY proxy (SF-1): dev server origin khác cổng compose đã set
    // CORS_DEV_ORIGIN (vd REMOTE_TASKS_PORT=4101) → chạy dev với API_BASE_URL=
    // (same-origin) là qua proxy này, không cần đụng stack compose. Prod không đi đây.
    proxy: [
      {
        context: ['/api'],
        target: `http://localhost:${process.env.NODE_SVC_PORT || 3001}`,
      },
    ],
  },
};
