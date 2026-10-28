import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { DefinePlugin, HtmlRspackPlugin } from '@rspack/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Windows-safe absolute path (URL.pathname yields a wrong /C:/... on win32)
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * MF remote `{{appName}}` — exposes `./{{remoteName}}Page` for a Module Federation
 * host (e.g. a Wakii shell) and ships a static standalone debug page.
 *
 * Pin matrix — versions tested together in the Wakii stack; upgrading any of them
 * means re-spiking through an isolated app first (shared singletons break silently
 * across version mismatches):
 *   react 19.3.0 · @rspack/core 1.7.12 · @module-federation/enhanced 0.21.6
 *
 * Build-time env (never hardcode — see README "Environment"):
 *   API_BASE_URL       — API base baked into the bundle via DefinePlugin. Dev native:
 *                        http://localhost:3001 (direct service, dev CORS open). Prod
 *                        behind a gateway: '' (same-origin, calls go through the proxy).
 *   REMOTE_PUBLIC_PATH — output.publicPath. Dev: http://localhost:<REMOTE_PORT>/ (absolute,
 *                        so the MF runtime fetches chunks from the remote origin). Prod:
 *                        /remotes/{{appName}}/ (relative through the gateway).
 *   REMOTE_PORT        — dev server port (default 4101).
 *   NODE_SVC_PORT      — dev-only /api proxy target (default 3001).
 */
const isDev = process.env.NODE_ENV !== 'production';

const port = Number(process.env.REMOTE_PORT || 4101);
const apiBaseUrl = process.env.API_BASE_URL ?? (isDev ? 'http://localhost:3001' : '');
const publicPath =
  process.env.REMOTE_PUBLIC_PATH || (isDev ? `http://localhost:${port}/` : `/remotes/{{appName}}/`);

export default {
  // 2 entries — both matter (paid-for bugs on rspack 1.7.12 + mf-enhanced 0.21.6):
  //   `index` = async boundary anchor for the MF container (remoteEntry.js). An entry
  //     that statically imports shared modules crashes in-host: loadShareSync runs
  //     before the share scope is initialized → "Invalid loadShareSync" → blank page.
  //   `standalone` = fully STATIC debug page entry: the whole graph (eager react, CSS,
  //     page) bundles synchronously into one chunk. This sidesteps the known bug where
  //     the prod build emits sharing data blocks pointing at stale phantom chunk ids
  //     and the consume machinery never lands → async imports pending forever.
  //   index.html injects ONLY `standalone` — both entries running in one page would
  //   double-bootstrap the same #root through two runtime copies.
  entry: {
    index: './src/index.tsx',
    standalone: './src/standalone.tsx',
  },
  output: {
    publicPath,
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    // CSS at output root + contenthash in prod (cache busting)
    cssFilename: isDev ? '[name].css' : '[name].[contenthash].css',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        // Tailwind v4 through PostCSS — rspack has no @tailwindcss/vite equivalent;
        // options live in postcss.config.mjs. The css experiment + this rule make
        // `import './styles.css'` work.
        test: /\.css$/,
        type: 'css',
        use: ['postcss-loader'],
      },
      {
        test: /\.tsx?$/,
        include: path.resolve(rootDir, 'src'),
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
    // index.html serves the standalone debug page only (see the entry comment above).
    new HtmlRspackPlugin({
      template: './index.html',
      chunks: ['standalone'],
    }),
    new DefinePlugin({
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
    }),
    new ModuleFederationPlugin({
      // MF container name — a valid JS identifier derived from the app name by
      // create-wakii-app ({{appName}} → {{remoteName}}). Register the remote in the
      // host under this EXACT name.
      name: '{{remoteName}}',
      filename: 'remoteEntry.js',
      exposes: {
        './{{remoteName}}Page': './src/{{remoteName}}Page.tsx',
      },
      // Singletons — keep ONE copy of each at runtime, provided by the host when
      // mounted in-shell. Without this, the remote bundles a second react →
      // "Invalid hook call" the moment the exposed page mounts in the host.
      //
      // requiredVersion: false — singletons always take the host's copy, so version
      // checks against it are pure noise (mf-enhanced infers them from package.json
      // and warns wrongly when versions drift).
      //
      // eager: true (paid-for bug): without it, the prod build emits sharing data
      // blocks pointing at stale phantom chunk ids and never emits the consume
      // machinery — the standalone entry hangs pending forever on a blank page.
      // Eager inlines shared modules into the entry chunk and drops the async
      // consume machinery. In-shell behavior is unchanged: the host provides react
      // first (singleton loaded-first), the remote's eager copy is only a fallback
      // that never activates. Dev server chunking differs and was never affected.
      shared: {
        react: { singleton: true, requiredVersion: false, eager: true },
        'react-dom': { singleton: true, requiredVersion: false, eager: true },
        // JSX compiles to react/jsx-runtime imports — not sharing it bundles a second
        // jsx-runtime → a second react at mount time ("Invalid hook call" in host).
        'react/jsx-runtime': { singleton: true, requiredVersion: false, eager: true },
        // Share TanStack Query symmetrically with the host — without it the remote
        // bundles its own copy and its context detaches from the host's
        // QueryClientProvider ("No QueryClient set" when mounted in-shell).
        '@tanstack/react-query': { singleton: true, requiredVersion: false, eager: true },
      },
    }),
  ],
  experiments: {
    css: true,
  },
  devServer: {
    port,
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: true,
    // DEV-ONLY proxy: run with API_BASE_URL='' (same-origin) and /api calls hit this
    // dev server, forwarding to the local service — no gateway needed while hacking
    // standalone. Prod traffic never goes through here.
    proxy: [
      {
        context: ['/api'],
        target: `http://localhost:${process.env.NODE_SVC_PORT || 3001}`,
      },
    ],
  },
};
