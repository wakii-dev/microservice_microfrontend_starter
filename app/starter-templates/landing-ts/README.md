# {{appName}}

A [React](https://react.dev) + [Vite](https://vite.dev) landing page wired to
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit). Scaffolded by
`create-wakii-app` with the **landing** preset: 1 trang duy nhất dogfooding
motion của kit (recipes 16-17 trong `docs/ai/recipes.md`) — **không router,
không data layer**, chỉ React + kit.

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
| `pnpm test` | Vitest (jsdom + Testing Library — 1 smoke test) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (typescript-eslint + react-hooks) |

## What's on the page

Một trang dài, mỗi section dùng 1 motion primitive của kit:

| Section | Component kit |
|---|---|
| Hero — panel gradient/blob trôi theo scroll | `Parallax` (speed 0.3 + scale, tự tắt khi reduced-motion) |
| KPI — số đếm ease-out trong thẻ trôi vào lệch pha | `Statistic` + `CountUp` + `Reveal` (delay 0/150/300) |
| Features — 3 card hiện dần từ hướng khác nhau | `Reveal` (direction up/left/right, delay 0/150/300) |
| FAQ — panel thu/mở | `CollapseTransition` (grid-rows, padding trong children) |
| Closer CTA + footer | `Button`, `Tag`, `Link` |

Header sticky (blur + logo + dark toggle) là markup thuần copy pattern
`template-feats/router` — nav là anchor link trong trang, không router.

## How theming works

- `src/styles.css` imports the kit's CSS in a fixed order:
  **tokens → dark theme → base reset → tailwind utilities** (the kit's
  `styles/tailwind.css` is Tailwind v4 *without* preflight — the kit keeps its
  own reset in `base.css`; do not add a second `@import "tailwindcss"`).
- Dark mode = `data-bp-theme="dark"` on `<html>`. `src/theme.ts` exposes
  `useAppTheme()` — persisted in `localStorage` and synced to the document
  element, so every kit component re-themes through CSS variables instantly.
- Colors in your own markup use kit utilities: `bg-canvas`, `bg-s1/s2/s3`,
  `text-ink/ink2/ink3`, `border-line`, `text-accent`, `bg-accent`.

> ⚠️ Keep the `@source '../node_modules/@wakii/ui-kit/src';` + `…/dist` lines in
> `src/styles.css`. The kit ships TS source; without those lines Tailwind never
> scans the kit's classes and the layout breaks.

## Motion & accessibility

Tất cả motion trên trang tự tắt khi visitor bật `prefers-reduced-motion` —
block global của kit lo phần CSS animation; riêng `scrollToSection` (cuộn mượt
khi bấm CTA) tự kiểm tra media query trước khi dùng `behavior: 'smooth'`.

## License

MIT — see [LICENSE](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/LICENSE).
