# AGENTS.md — {{appName}} (Module Federation remote)

Read this before writing code. This app is an **MF remote island**: it exposes exactly
one module (`./{{remoteName}}Page`) to a host, and runs standalone only for development.

## What is what

```
rspack.config.mjs            MF container (name {{remoteName}}, remoteEntry.js) + 2 entries + env
postcss.config.mjs           Tailwind v4 via PostCSS (rspack has no @tailwindcss/vite)
index.html                   standalone debug page shell (injects the `standalone` entry only)
src/index.tsx                MF container anchor — async boundary, never executes in a page
src/standalone.tsx           dev-only bootstrap: global CSS + QueryClientProvider + banner
src/{{remoteName}}Page.tsx   THE exposed surface — demo data (useState), no fetching
src/styles.css               Tailwind entry: 4 kit imports + @source lines (do not reorder)
tests/                       smoke test of the exposed page + jsdom setup (matchMedia stub)
```

## Island rules (who may import whom)

- `{{remoteName}}Page.tsx` is the **entire public surface**. Anything the host must
  reach goes through it. Do not add more exposes casually — each expose is a contract
  with the host.
- The exposed page must not import global CSS (`styles.css` lives only in
  `standalone.tsx`). In-shell the host owns global CSS; a remote that pulls its own
  tokens/base can restyle the host page.
- No server-only code, no router, no global stores. The remote is a self-contained
  island: data comes in through props/state/query hooks inside the page.
- Kit components come from `@wakii/ui-kit` — do not restyle them with raw CSS files;
  use kit utilities (`bg-canvas`, `text-ink2`, `border-line`, …) in markup.

## MF rules (the parts that bite)

- **Pin matrix**: react 19.3.0 · @rspack/core 1.7.12 · @module-federation/enhanced
  0.21.6. Upgrading any of these = re-spike through an isolated app first. Do not bump
  casually.
- **Shared singletons** (see `rspack.config.mjs`): react, react-dom, `react/jsx-runtime`,
  `@tanstack/react-query` — all `singleton + requiredVersion:false + eager`. This exact
  combination exists because of real production bugs (second react copy → "Invalid hook
  call"; non-eager sharing → stale phantom chunks, standalone pending forever). Change
  only with a spike proving both standalone and in-shell still work.
- **`index.tsx` stays an async boundary** — never add static imports of shared modules
  to it. `standalone.tsx` is the only place that bootstraps a page.
- **MF container name** is `{{remoteName}}` (derived from the app name by
  create-wakii-app — a valid JS identifier). The host registers the remote under this
  exact name; renaming it is a breaking contract.
- **Build-time env only**: `API_BASE_URL`, `REMOTE_PUBLIC_PATH`, `REMOTE_PORT`,
  `NODE_SVC_PORT` (see rspack.config.mjs). No runtime env in the browser bundle.

## Verify

```bash
pnpm test          # smoke test — exposed page renders + interactive
pnpm typecheck
pnpm build         # must emit dist/remoteEntry.js
ls dist/remoteEntry.js
```

`pnpm dev` → http://localhost:4101 shows the standalone debug page with the banner.
