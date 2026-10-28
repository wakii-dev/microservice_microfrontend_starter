# {{appName}}

A [React](https://react.dev) + [Vite](https://vite.dev) starter wired to
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — a Tailwind v4 design
system with 90+ components, hooks, dark theme and motion. Scaffolded by
`create-wakii-app` with the **product** preset: chuẩn cấu trúc + data layer đầy đủ —
TanStack Query, zod, MSW (mock API trong dev) và feature `tasks` mẫu theo pattern
containers.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:5173 — MSW phục vụ /tasks, KHÔNG cần backend
```

Để nối backend thật: đặt `VITE_API_URL=http://…` trong `.env.local` (dev vẫn chạy
MSW — bỏ dynamic import trong `src/main.tsx` để tắt) hoặc dùng build production.

## Scripts

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Dev server (Vite) + MSW mock API |
| `pnpm build` / `pnpm preview` | Build production / xem thử build |
| `pnpm test` | Vitest (jsdom + Testing Library + msw node) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint — gồm luật kiến trúc (boundaries) |

## What's inside

- **Data layer**: `shared/api/client.ts` (fetch wrapper — baseURL từ env, timeout
  8s, error envelope `{message}`) + `shared/api/query-keys.ts` (factory keys
  TanStack Query) + `app/query-client.ts` (instance dùng chung).
- **Feature mẫu `features/tasks/`**: schema zod → api (parse response) → hooks
  (list + toggle optimistic, form) → ui (Table + Tag + Field/Input, EmptyState
  khi rỗng, Alert lỗi + Thử lại) → containers (nối data) → `index.ts` (cổng
  public). Test mẫu: api (msw node + zod parse), hooks (renderHook + wrapper
  QueryClient), ui (RTL props cứng), container (integration qua MSW).
- **Mock**: MSW browser worker chỉ chạy dev — handlers CRUD giả trong `src/mocks/`
  (CRUD + POST trùng tiêu đề → 409). 2 flag demo trên URL để rehearse UI trạng
  thái đặc biệt: `http://localhost:5173/?empty=1` (list rỗng → EmptyState),
  `/?boom=1` (GET lỗi 500 → Alert + nút Thử lại — bỏ flag rồi bấm là dữ liệu về).
- **Luật kiến trúc**: [AGENTS.md](AGENTS.md) — bảng import allowed/blocked,
  quy ước đặt tên (XxxContainer ↔ Xxx, useXxx, xxx-api.ts, schema.ts), recipe
  "thêm feature mới" 5 bước. Enforce bằng `pnpm lint`.

## How theming works

- `src/styles.css` imports the kit's CSS in a fixed order:
  **tokens → dark theme → base reset → tailwind utilities** (the kit's
  `styles/tailwind.css` is Tailwind v4 *without* preflight — the kit keeps its
  own reset in `base.css`; do not add a second `@import "tailwindcss"`).
- Dark mode = `data-bp-theme="dark"` on `<html>`. `src/app/theme.ts` exposes
  `useAppTheme()` — persisted in `localStorage` and synced to the document
  element, so every kit component re-themes through CSS variables instantly.

> ⚠️ Keep the `@source '../node_modules/@wakii/ui-kit/src';` + `…/dist` lines in
> `src/styles.css`. The kit ships TS source; without those lines Tailwind never
> scans it and the utilities used inside kit components won't be generated
> (broken layouts).

## Project structure

```
├── index.html              # Vite entry — <title> is your app name
├── AGENTS.md               # Kiến trúc + luật import + recipe — đọc TRƯỚC khi code
├── public/mockServiceWorker.js   # MSW worker (msw init — nâng cấp msw thì chạy lại)
├── src/
│   ├── main.tsx            # wire: MSW (dev) → styles → Providers → Router
│   ├── env.ts              # zod validate import.meta.env (VITE_API_URL optional)
│   ├── app/                # providers · query-client · router · theme
│   ├── routes/             # Home (feature tasks) + NotFound
│   ├── features/tasks/     # feature mẫu: schema · api · hooks · containers · ui
│   ├── mocks/              # MSW handlers CRUD giả + browser worker
│   └── shared/             # api/ (client + query-keys) · ui/ · lib/
├── vite.config.ts · vitest.config.ts · eslint.config.js   # alias @/ → src
└── tsconfig.json           # strict TypeScript (bundler resolution)
```

Want just a blank page without the data layer? Scaffold with `--preset minimal`.
Need an admin layout (sidebar + menu + dashboard + login)? Use `--preset admin`.

## Thêm Chart vào dashboard (chart.js)

Overlay không sửa được `package.json` của bạn, nên Chart chưa cài sẵn — 2 bước:

```bash
pnpm add chart.js
```

```tsx
import { Chart } from '@wakii/ui-kit/chart';   // subpath — chart.js lazy bên trong

<Chart config={{ type: 'bar', labels: ['T2','T3','T4'], datasets: [{ label: 'Tasks', data: [3,5,2] }] }} height={240} />
```

Màu tự theo theme light/dark; muốn palette tự chọn vẫn ăn dark: `useChartPalette()` từ `@wakii/ui-kit`.

## Links

- Storybook (live playground): <https://storybook-static-khaki-two.vercel.app>
- npm package: <https://www.npmjs.com/package/@wakii/ui-kit>
