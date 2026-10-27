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

Interactive flow — you are only prompted for what's missing (project name → **preset?** → framework vite/next/astro — demo only → react-router? / extras — demo+vite only → confirm → scaffold), then it prints the next steps:

```
cd my-app
pnpm install
pnpm dev
```

## Presets

| Preset | What you get | Base template |
|---|---|---|
| `demo` *(default)* | Demo page dogfooding the kit + react-router + optional extras (chart/carousel/schedule/editor) — framework chọn qua `--variant`: `vite` (SPA, default) / `next` (App Router) / `astro` (React island) | `vite-ts` / `vite-js` / `next-ts` / `astro-ts` |
| `minimal` | Chuẩn cấu trúc (app/routes/shared, router lazy + Suspense, env zod, eslint boundaries, vitest) và trang trắng — **không data layer** | `minimal-ts` |
| `product` | minimal + **TanStack Query + zod + MSW** (mock API trong dev) + feature `tasks` mẫu theo pattern containers + 3 test mẫu (api/hooks/ui) | `product-ts` |
| `admin` | product + **overlay layout admin**: Sidebar collapsible + Menu (icon-only khi thu) + Header, trang Dashboard (KPI CountUp + Table + Timeline), trang Tasks, trang Login (useForm + zod) | `product-ts` + `template-feats/admin` |
| `landing` | 1 trang landing **motion showcase** (recipes 16-17): hero Parallax gradient/blob + KPI Statistic/CountUp Reveal stagger + feature cards Reveal up/left/right + FAQ CollapseTransition + closer CTA — **không router, không data layer** | `landing-ts` |

Preset khác `demo`: template đóng gói sẵn cấu trúc của nó (minimal/product/admin có sẵn router; landing là trang đơn **không router**), chỉ hỗ trợ `ts`, và KHÔNG nhận `--extras` — vi phạm sẽ báo lỗi rõ:

```bash
pnpm create wakii-app my-app --yes                                   # demo preset, mọi default
pnpm create wakii-app my-app --variant next --yes                    # demo trên Next.js App Router
pnpm create wakii-app my-app --variant astro                         # demo trên Astro + React island
pnpm create wakii-app my-app --preset minimal --yes                  # trắng, không data layer
pnpm create wakii-app my-app --preset product --yes                  # + TanStack Query/zod/MSW
pnpm create wakii-app my-app --preset admin --yes                    # + layout admin (dashboard + login)
pnpm create wakii-app landing-app --preset landing --yes             # 1 trang landing motion showcase
pnpm create wakii-app ~/code/my-app --lang js --skip-install         # path + JavaScript (chỉ preset demo)
```

## Flags

| Flag | Meaning | Default |
|---|---|---|
| `[appName]` (positional) | A name **or a path**: `my-app` → `./my-app`; `/a/b/my-app` → target `/a/b/my-app`. The package name is always the **basename** (a path never leaks into package.json) | prompt (`my-wakii-app`) |
| `--preset <tên>` | `demo \| minimal \| product \| admin \| landing` (also accepts `--preset=product`) | `demo` |
| `--variant <tên>` | `vite \| next \| astro` — framework của **preset demo** (also accepts `--variant=next`). Chỉ áp dụng demo: preset khác → lỗi "variant chỉ dành cho preset demo" | `vite` |
| `--lang ts\|js` | TypeScript / JavaScript (also accepts `--lang=js`). Preset khác demo → lỗi "chỉ hỗ trợ TypeScript" | `ts` |
| `--router` / `--no-router` | react-router v7 — lựa chọn của **preset demo × variant vite** (prompted when missing — unless `--yes`); non-demo template tự quản routing (landing: trang đơn không router) | on |
| `--extras <list>` | demo subpaths: `chart · carousel · schedule · editor` (also accepts `--extras=a`). Extras **imply the router** (each demo subpath is its own route). Preset khác demo → lỗi "extras chỉ dành cho preset demo" | none |
| `--yes` | skip prompts, take all defaults | — |
| `--skip-install` | omit `pnpm install` from the next steps | — |
| `-h`, `--help` | print usage | — |

Intentional errors: `--no-router` together with `--extras` (demo), non-demo preset with `--extras`/`--lang js`, `--variant` khác `vite` với non-demo preset/`--lang js`/`--extras` — the CLI reports each conflict clearly and exits (drop one of the two). The CLI **never installs** anything — it only prints next steps (`cd` to the exact target it created, even when you passed a path).

## What's in the template

Base (ts/js) — a demo app dogfooding **`@wakii/ui-kit` ^0.5.0** (pinned: the first version with dist exports):

- **A working dark toggle** — `useAppTheme` (src/theme) persists to `localStorage` and sets `data-bp-theme` on `<html>`; every kit component cascades, no re-render.
- **Demo components**: wash hero + Tag/Title/Text + 3 Buttons · a 3-column Table (Badge statuses) · Alert ×4 · CountUp Statistic · a "What's inside" Card (Storybook + npm links).
- **Tokens-first**: a single styles.css (kit tokens + base + Tailwind v4 + the kit `@source`) — zero hex in the app.

Router (on by default, react-router v7): a `/` demo route plus `/about` introducing the kit (NavLink). Extras: each extra adds one demo route using the matching subpath (`@wakii/ui-kit/chart`, `./carousel`, `./schedule`, `./editor`) and writes its peer dependency into package.json.

## Architecture (repo)

- `src/options.ts` — hand-rolled flag parser (zero parser dependencies) + defaults + validation (`--no-router` × `--extras`, non-demo × `--extras`/`--lang js`, variant ≠ vite × non-demo/extras/js throw)
- `src/scaffold.ts` — maps preset → base template (`demo` → `vite-ts|vite-js` theo `--variant`, hoặc `next-ts`/`astro-ts`; `minimal` → `minimal-ts`, `product` → `product-ts`, `admin` → `product-ts` **+ overlay `template-feats/admin` đè lên**, `landing` → `landing-ts`) → recursive copy → renders the `{{appName}}` placeholder (binaries skipped) → applies overlays → merges dependencies into package.json (router dep only for `demo` — the other templates list their own deps)
- `src/index.ts` — the `@clack/prompts` flow + logging + next steps (UI wiring only; preset is asked first, variant prompt is demo-only, router/extras prompts are demo × vite only)

Template sources: `app/starter-templates/{vite-ts,vite-js,minimal-ts,product-ts,next-ts,astro-ts,landing-ts}` + `template-feats/{router,extras,admin}` (owned by separate workers). JS-variant overlays must be type-free (the engine only renames `.tsx→.jsx`); if an overlay ships its own `vite-js/` directory, that directory is used as-is. Non-demo presets are TS-only.

## Development

```bash
pnpm --filter create-wakii-app typecheck
pnpm --filter create-wakii-app test      # fixture templates in tmp — no network
```

Publishing to npmjs: `./scripts/publish-npm.sh` — builds (tsup), then bundles `dist` + **`starter-templates/`** (toàn bộ thư mục: vite-ts, vite-js, minimal-ts, product-ts, next-ts, astro-ts, landing-ts + template-feats) into the package (`files` field — npm rejects parent paths like `../`), sets `publishConfig` to public, and publishes using `NPM_TOKEN` (env) or an existing `_authToken` in `~/.npmrc`.

## CI

Golden-path workflow [`.github/workflows/starter-templates.yml`](../../.github/workflows/starter-templates.yml) — chạy trên mọi push/PR đụng `app/create-wakii-app/**` hoặc `app/starter-templates/**`: test + typecheck CLI → build tsup → scaffold cả 7 kiểu (`demo-ts` · `demo-js` · `next` · `astro` · `minimal` · `product` · `admin`) vào `/tmp` → mỗi app phải `pnpm install` + `pnpm build` được (`product`/`admin` thêm `pnpm test`). App nào gãy ở bất kỳ bước nào → job đỏ — đây là rào chắn trước khi publish, chống tái diễn sự cố 0.5.0/0.6.x (template publish nhưng app scaffold không build được). Lưu ý: repo Actions hiện đang disable (billing) — workflow sẵn sàng chạy khi bật lại.

## License

MIT — see [LICENSE](./LICENSE).
