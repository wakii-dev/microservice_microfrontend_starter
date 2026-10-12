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
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    // fe-shared (READ-ONLY, SF-1) import kiểu NodeNext: './x.js' chỉ tới file .ts
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
    },
  },
  module: {
    rules: [
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
      // remote consume singleton do shell host cung cấp khi load trong shell)
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  devServer: {
    port: Number(process.env.REMOTE_ACTIVITY_PORT || 4002),
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: true,
  },
};
