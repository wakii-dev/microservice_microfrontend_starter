import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { DefinePlugin, HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Remote `activity` — MF REMOTE (SF-6, FI-74). Expose `./ActivityPage` load vào shell slot
 * (registry conventions/08 — ĐỔI tên/expose = breaking, phải đồng bộ conventions/08 + shell).
 * Port dev 4002 (conventions/05). Pin matrix theo frontend/shared mfToolkit
 * (react 19.3.0 / rspack 1.7.12 / mf-enhanced 0.21.6 — nâng cấp = re-spike).
 *
 * Env build-time (conventions/06 — KHÔNG hardcode):
 *   API_BASE_URL — base gọi API. Dev native: http://localhost:8082 (go-svc trực tiếp,
 *     CORS dev mở — conventions/07). Prod (qua gateway): '' (same-origin).
 *   REMOTE_PUBLIC_PATH — publicPath chunk. Dev: http://localhost:4002/ (absolute —
 *     bài học spike SF-1). Prod: /remotes/activity/ (relative qua gateway, conventions/08).
 *   REMOTE_ACTIVITY_PORT — port dev server (default 4002, conventions/05).
 */
const isDev = process.env.NODE_ENV !== 'production';

const apiBaseUrl = process.env.API_BASE_URL ?? (isDev ? 'http://localhost:8082' : '');
const publicPath = process.env.REMOTE_PUBLIC_PATH || (isDev ? 'http://localhost:4002/' : '/remotes/activity/');

export default {
  entry: './src/index.tsx',
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
        type: 'css',
      },
      {
        test: /\.tsx?$/,
        // fe-shared là package TS raw (main: ./src/index.ts) — bundler phải compile luôn
        include: [path.resolve(rootDir, 'src'), /[\\/]frontend[\\/]shared[\\/]src/],
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
    // index.html chỉ dùng cho standalone debug (:4002) — khi load trong shell, entry này không chạy
    new HtmlRspackPlugin({
      template: './index.html',
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    }),
    new ModuleFederationPlugin({
      name: 'activity',
      filename: 'remoteEntry.js',
      exposes: {
        './ActivityPage': './src/ActivityPage.tsx',
      },
      // Singleton theo pin matrix — KHÔNG bundle duplicate react (spec slice mục 3;
      // remote consume singleton do shell host cung cấp khi load trong shell).
      // requiredVersion: false — deps ghi "catalog:" (pnpm protocol) bị mf-enhanced infer
      // nhầm thành requiredVersion literal → version-check warning sai against host 19.3.0.
      // Singleton = luôn dùng bản của host, không cần check.
      shared: {
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        // JSX fe-shared compile ra import react/jsx-runtime — thiếu = bundle jsx-runtime
        // riêng → react thứ 2 khi mount trong shell ("Invalid hook call", spike R2 SF-1)
        'react/jsx-runtime': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  experiments: {
    css: true,
  },
  devServer: {
    port: Number(process.env.REMOTE_ACTIVITY_PORT || 4002),
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: true,
    // DEV-ONLY proxy (SF-1): dev server origin khác cổng compose đã set
    // CORS_DEV_ORIGIN (vd REMOTE_ACTIVITY_PORT=4102) → chạy dev với API_BASE_URL=
    // (same-origin) là qua proxy này, không cần đụng stack compose. Prod không đi đây.
    proxy: [
      {
        context: ['/api'],
        target: `http://localhost:${process.env.GO_SVC_PORT || 8082}`,
      },
    ],
  },
};
