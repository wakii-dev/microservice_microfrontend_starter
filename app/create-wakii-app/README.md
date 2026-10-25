# create-wakii-app

[![npm](https://img.shields.io/npm/v/create-wakii-app?logo=npm&label=create-wakii-app)](https://www.npmjs.com/package/create-wakii-app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

Scaffold a React app wired with [@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — CRA-style: interactive prompts, non-interactive flags. **Published as [`create-wakii-app@0.1.0`](https://www.npmjs.com/package/create-wakii-app) on npmjs.org.**

## Usage

```bash
npm create wakii-app@latest my-app     # official
npx create-wakii-app my-app            # npx
pnpm create wakii-app my-app           # pnpm
yarn create wakii-app my-app           # yarn
```

Interactive flow — you are only prompted for what's missing (project name → react-router? → extras multiselect → confirm → scaffold), then it prints the next steps:

```
cd my-app
pnpm install
pnpm dev
```

Non-interactive:

```bash
pnpm create wakii-app my-app --yes                                  # all defaults (ts + router, no extras)
pnpm create wakii-app my-app --yes --extras chart                   # defaults + a chart demo route
pnpm create wakii-app ~/code/my-app --lang js --skip-install        # path + JavaScript, skip the install hint
```

## Flags

| Flag | Meaning | Default |
|---|---|---|
| `[appName]` (positional) | A name **or a path**: `my-app` → `./my-app`; `/a/b/my-app` → target `/a/b/my-app`. The package name is always the **basename** (a path never leaks into package.json) | prompt (`my-wakii-app`) |
| `--lang ts\|js` | TypeScript / JavaScript (also accepts `--lang=js`) | `ts` |
| `--router` / `--no-router` | react-router v7 (prompted when missing — unless `--yes`) | on |
| `--extras <list>` | demo subpaths: `chart · carousel · schedule · editor` (also accepts `--extras=a`). Extras **imply the router** (each demo subpath is its own route) | none |
| `--yes` | skip prompts, take all defaults | — |
| `--skip-install` | omit `pnpm install` from the next steps | — |
| `-h`, `--help` | print usage | — |

Intentional error: `--no-router` together with `--extras` is a conflict → the CLI reports it clearly and exits (drop one of the two). The CLI **never installs** anything — it only prints next steps (`cd` to the exact target it created, even when you passed a path).

## What's in the template

Base (ts/js) — a demo app dogfooding **`@wakii/ui-kit` ^0.5.0** (pinned: the first version with dist exports):

- **A working dark toggle** — `useAppTheme` (src/theme) persists to `localStorage` and sets `data-bp-theme` on `<html>`; every kit component cascades, no re-render.
- **Demo components**: wash hero + Tag/Title/Text + 3 Buttons · a 3-column Table (Badge statuses) · Alert ×4 · CountUp Statistic · a "What's inside" Card (Storybook + npm links).
- **Tokens-first**: a single styles.css (kit tokens + base + Tailwind v4 + the kit `@source`) — zero hex in the app.

Router (on by default, react-router v7): a `/` demo route plus `/about` introducing the kit (NavLink). Extras: each extra adds one demo route using the matching subpath (`@wakii/ui-kit/chart`, `./carousel`, `./schedule`, `./editor`) and writes its peer dependency into package.json.

## Architecture (repo)

- `src/options.ts` — hand-rolled flag parser (zero parser dependencies) + defaults + validation (`--no-router` × `--extras` throws)
- `src/scaffold.ts` — recursive template copy → renders the `{{appName}}` placeholder (binaries skipped) → applies the `router` / `extras/<name>` overlays → merges dependencies into package.json
- `src/index.ts` — the `@clack/prompts` flow + logging + next steps (UI wiring only)

Template sources: `app/starter-templates/vite-ts|vite-js` + `template-feats/` (owned by a separate worker). JS-variant overlays must be type-free (the engine only renames `.tsx→.jsx`); if an overlay ships its own `vite-js/` directory, that directory is used as-is.

## Development

```bash
pnpm --filter create-wakii-app typecheck
pnpm --filter create-wakii-app test      # fixture templates in tmp — no network
```

Publishing to npmjs: `./scripts/publish-npm.sh` — builds (tsup), then bundles `dist` + **`starter-templates/`** (vite-ts + vite-js) into the package (`files` field — npm rejects parent paths like `../`), sets `publishConfig` to public, and publishes using `NPM_TOKEN` (env) or an existing `_authToken` in `~/.npmrc`.

## License

MIT — see [LICENSE](./LICENSE).
