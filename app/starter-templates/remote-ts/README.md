# {{appName}}

A standalone **Module Federation remote** scaffolded by `create-wakii-app --as-remote`:
Rspack + React 19 + [@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) with
the MF expose config pre-wired (`remoteEntry.js` + `./{{remoteName}}Page`), ready to
plug into a Wakii MF host (shell) — or run standalone while you build it.

The exposed page ships with demo data (`useState`, no fetching) so the remote boots
end-to-end on day one. Swap in your own data layer and keep the JSX shape.

## Quick start (standalone)

```bash
pnpm install
pnpm dev        # standalone debug page — http://localhost:4101
pnpm build      # dist/remoteEntry.js + dist/standalone.* — what a host loads
```

The dev server binds `REMOTE_PORT` (default **4101**). `pnpm dev` serves the standalone
debug page; the MF container entry (`index`) is build-time only — a host never executes
it in a page.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server (standalone debug page, CORS open, `/api` proxy) |
| `pnpm build` | Production build → `dist/remoteEntry.js` + assets |
| `pnpm test` | Vitest (jsdom + Testing Library) — smoke test of the exposed page |
| `pnpm typecheck` | `tsc --noEmit` |

## Environment (build-time)

| Variable | Default (dev) | Meaning |
|---|---|---|
| `API_BASE_URL` | `http://localhost:3001` | Baked into the bundle. Behind a gateway in prod: `''` (same-origin). |
| `REMOTE_PUBLIC_PATH` | `http://localhost:4101/` (dev) · `/remotes/{{appName}}/` (prod) | `output.publicPath` — where the MF runtime fetches chunks. |
| `REMOTE_PORT` | `4101` | Dev server port. |
| `NODE_SVC_PORT` | `3001` | Dev-only `/api` proxy target. |

Example: `API_BASE_URL= REMOTE_PORT=4201 pnpm dev` — same-origin calls through the dev
proxy on a custom port.

## Plug into a Wakii stack

The remote is a passive island — a stack adopts it in 2 registrations:

**1. Gateway route** (nginx, e.g. the stack's `platform/gateway`):

```nginx
location /remotes/{{appName}}/ {
    proxy_pass http://{{appName}}:4101/;   # or your static hosting origin
}
```

Serve the built `dist/` at that path (`REMOTE_PUBLIC_PATH=/remotes/{{appName}}/` at
build time keeps chunk URLs aligned).

**2. Shell registry** — register the MF container and mount the exposed module:

```ts
// remote name MUST equal the MF container name: {{remoteName}}
// (create-wakii-app derives it from the app name: {{appName}} → {{remoteName}})
remotes: {
  {{remoteName}}: `{{remoteName}}@http://localhost:4101/remoteEntry.js`,
}

// mount it (lazy, inside React):
const {{remoteName}}Page = React.lazy(() => import('{{remoteName}}/{{remoteName}}Page'));
```

In-shell, the host provides react / react-dom / react-query as MF singletons — the
remote never bundles a second copy. See `rspack.config.mjs` for the pin matrix and the
paid-for-bug notes (async boundary entry, eager singletons, `react/jsx-runtime` share).

## Replace the demo data

`src/{{remoteName}}Page.tsx` is the entire public surface: demo rows in `useState`,
a kit `Table`, a status `Badge`, filter `Input`, `Button`. Typical next step:

```ts
const { data } = useQuery({
  queryKey: ['rows'],
  queryFn: () => fetch(`${__API_BASE_URL__}/api/rows`).then((r) => r.json()),
});
```

(`@tanstack/react-query` is already a dependency and an MF shared singleton.) Keep the
page free of global-CSS imports — `src/styles.css` loads once in `standalone.tsx`, and
in-shell the host owns global CSS.

## Pin matrix

`react 19.3.0` · `@rspack/core 1.7.12` · `@module-federation/enhanced 0.21.6` — these
versions are tested together in the Wakii stack. Upgrading any of them requires
re-spiking through an isolated app first; the MF sharing machinery breaks silently
across mismatches.

## Links

- Storybook (kit playground): <https://storybook-static-khaki-two.vercel.app>
- npm package: <https://www.npmjs.com/package/@wakii/ui-kit>
