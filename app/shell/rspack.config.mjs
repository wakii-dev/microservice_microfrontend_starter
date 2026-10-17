import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { DefinePlugin, HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shell — MF host (SF-5). Pin matrix theo app/shared/package.json mfToolkit:
 * react 19.3.0 / rspack 1.7.12 / mf-enhanced 0.21.6 (nâng cấp = re-spike).
 *
 * Env build-time (conventions/06 + 08 — KHÔNG hardcode):
 *   REMOTE_TASKS_URL / REMOTE_ACTIVITY_URL — remoteEntry của 2 remote
 *     (dev native: http://localhost:4001|4002/remoteEntry.js; prod: mặc định đi qua gateway /remotes/<name>/)
 *   API_BASE_URL — base gọi API. Dev native: http://localhost:8090 (auth-mock trực tiếp,
 *     CORS dev mở — conventions/07). Prod (qua gateway): '' (same-origin).
 *   SHELL_PORT — port dev server (default 3000, conventions/05).
 */
const isDev = process.env.NODE_ENV !== 'production';

const remoteTasksUrl = process.env.REMOTE_TASKS_URL || '/remotes/tasks/remoteEntry.js';
const remoteActivityUrl = process.env.REMOTE_ACTIVITY_URL || '/remotes/activity/remoteEntry.js';
const apiBaseUrl = process.env.API_BASE_URL ?? (isDev ? 'http://localhost:8090' : '');

export default {
  entry: './src/index.tsx',
  output: {
    publicPath: '/',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    // CSS emit ở ROOT (không nằm trong /assets/ immutable) + contenthash prod (cache-busting)
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
      {
        test: /\.css$/,
        type: 'css',
      },
      {
        test: /\.tsx?$/,
        // fe-shared là package TS raw (main: ./src/index.ts) — bundler phải compile luôn
        include: [path.resolve(rootDir, 'src'), /[\\/]app[\\/]shared[\\/]src/],
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
    new HtmlRspackPlugin({
      template: './index.html',
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      // F1 (review VU-53): cùng nguồn với remotes config ở trên — shell bootstrap nạp vào
      // __REMOTE_URLS__ (remote-urls.ts) để retry BUG-2 re-register ĐÚNG url build-time
      __REMOTE_TASKS_URL__: JSON.stringify(remoteTasksUrl),
      __REMOTE_ACTIVITY_URL__: JSON.stringify(remoteActivityUrl),
    }),
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      remotes: {
        tasks: `tasks@${remoteTasksUrl}`,
        activity: `activity@${remoteActivityUrl}`,
      },
      // Singleton theo pin matrix — KHÔNG bundle duplicate react (spec slice mục 3).
      // react/jsx-runtime: JSX fe-shared compile ra import này — thiếu = remote bundle
      // riêng jsx-runtime kéo theo react thứ 2 → "Invalid hook call" (SF-1 spike R2).
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react/jsx-runtime': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  experiments: {
    css: true,
  },
  devServer: {
    port: Number(process.env.SHELL_PORT || 3000),
    historyApiFallback: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    // DEV-ONLY proxy — topology gateway dev thu nhỏ (đủ 4 route như gateway
    // conventions/08): /api/tasks → node-svc, /api/activity → go-svc, /api/users →
    // spring-svc, /api/auth → auth-mock. Shell là host, REMOTE chạy trong page
    // context của shell nên /api/<svc> của remote cũng về đây. Origin dev khác cổng
    // docker compose đã set CORS_DEV_ORIGIN (vd SHELL_PORT=3100) → cùng-origin qua
    // proxy thay vì đụng stack compose. Prod không đi đây (gateway).
    proxy: [
      {
        context: ['/api/tasks'],
        target: `http://localhost:${process.env.NODE_SVC_PORT || 3001}`,
      },
      {
        context: ['/api/activity'],
        target: `http://localhost:${process.env.GO_SVC_PORT || 8082}`,
      },
      {
        context: ['/api/users'],
        target: `http://localhost:${process.env.SPRING_SVC_PORT || 8081}`,
      },
      {
        context: ['/api/auth'],
        target: `http://localhost:${process.env.AUTH_MOCK_PORT || 8090}`,
      },
    ],
  },
};
