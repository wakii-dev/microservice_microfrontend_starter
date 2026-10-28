# {{appName}}

A [React](https://react.dev) + [Vite](https://vite.dev) starter wired to
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — a Tailwind v4 design
system with 90+ components, hooks, dark theme and motion. Scaffolded by
`create-wakii-app` with the **minimal** preset (JavaScript): chuẩn cấu trúc
(router, routes, shared, env-zod, eslint boundaries, vitest) và trang trắng —
**không data layer**, không demo page. Bản TypeScript: scaffold lại với
`--lang ts` (template `minimal-ts`) — y hệt, chỉ khác types.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:5173
```

## Scripts

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Dev server (Vite) |
| `pnpm build` / `pnpm preview` | Build production / xem thử build |
| `pnpm test` | Vitest (jsdom + Testing Library) |
| `pnpm lint` | ESLint — gồm luật kiến trúc (boundaries) |

> Bản JS không có script `typecheck` — `jsconfig.json` chỉ để IDE hiểu alias
> `@/` (với `checkJs: false`, không type-check gì).

## How theming works

- `src/styles.css` imports the kit's CSS in a fixed order:
  **tokens → dark theme → base reset → tailwind utilities** (the kit's
  `styles/tailwind.css` is Tailwind v4 *without* preflight — the kit keeps its
  own reset in `base.css`; do not add a second `@import "tailwindcss"`).
- Dark mode = `data-bp-theme="dark"` on `<html>`. `src/app/theme.js` exposes
  `useAppTheme()` — persisted in `localStorage` and synced to the document
  element, so every kit component re-themes through CSS variables instantly.
- Colors in your own markup use kit utilities: `bg-canvas`, `bg-s1/s2/s3`,
  `text-ink/ink2/ink3`, `border-line`, `text-accent`, `bg-accent`.

> ⚠️ Keep the `@source '../node_modules/@wakii/ui-kit/src';` + `…/dist` lines in
> `src/styles.css`. The kit ships TS source; without those lines Tailwind never
> scans it and the utilities used inside kit components won't be generated
> (broken layouts).

## Project structure

```
├── index.html              # Vite entry — <title> is your app name
├── AGENTS.md               # Kiến trúc + luật import + quy ước — đọc TRƯỚC khi code
├── src/
│   ├── main.jsx            # wire: styles → Providers → BrowserRouter → Router
│   ├── env.js              # zod validate import.meta.env (VITE_API_URL optional)
│   ├── styles.css          # kit CSS imports + Tailwind @source
│   ├── app/                # providers · router (header + lazy routes) · theme
│   ├── routes/             # 1 file = 1 trang (Home, NotFound) + test mẫu
│   └── shared/             # ui/ (PageHeader) · lib/ (utils)
├── vite.config.mjs · vitest.config.mjs · eslint.config.js   # alias @/ → src
└── jsconfig.json           # IDE: alias @/ + jsx (checkJs: false — không type-check)
```

Architecture rules (who may import whom) live in [AGENTS.md](AGENTS.md) and are
enforced by ESLint — run `pnpm lint`.

Need the full data layer (TanStack Query + zod + MSW + feature scaffolding)?
Re-scaffold with `--preset product` (or `--preset admin` for an admin layout).

## Links

- Storybook (live playground): <https://storybook-static-khaki-two.vercel.app>
- npm package: <https://www.npmjs.com/package/@wakii/ui-kit>
