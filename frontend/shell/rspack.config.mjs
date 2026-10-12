import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { DefinePlugin, HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows-safe absolute path (URL.pathname cho ra /C:/... sai trên win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shell — MF host (SF-5). Pin matrix theo frontend/shared/package.json mfToolkit:
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
    new HtmlRspackPlugin({
      template: './index.html',
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    }),
    new ModuleFederationPlugin({
      name: 'shell',
      filename: 'remoteEntry.js',
      remotes: {
        tasks: `tasks@${remoteTasksUrl}`,
        activity: `activity@${remoteActivityUrl}`,
      },
      // Singleton theo pin matrix — KHÔNG bundle duplicate react (spec slice mục 3)
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
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
  },
};
