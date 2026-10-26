# {{appName}}

A [Next.js](https://nextjs.org) (app router) + [React](https://react.dev) starter wired to
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — a Tailwind v4 design system with
90+ components, hooks, dark theme and motion. Scaffolded by `create-wakii-app`.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
pnpm start    # serve the production build
```

The home page dogfoods the kit: sticky brand header (W mark) · dark mode toggle ·
`Alert` ×4 severities · `Card` · `Table` with `Tag` status · `Statistic` + `CountUp` ·
`Button` ×2 · `Title`/`Text`.

## Notes for this stack

- **`'use client'`**: the kit ships plain (Vite/MF-oriented) components, so every page or
  component that renders kit pieces needs the `'use client'` directive (see `app/page.tsx`).
  No `transpilePackages` needed — the CSS wiring below is all it takes.
- **Dark mode**: `app/components/ThemeToggle.tsx` persists `app-theme` in `localStorage` and
  syncs `data-bp-theme` on `<html>` — every kit component re-themes through CSS variables
  instantly, no reload. Storage is read after mount, so SSR and hydration always match.
- **Tailwind v4**: `app/globals.css` imports the kit CSS in a fixed order —
  **tokens → dark theme → base reset → tailwind utilities** (the kit's
  `styles/tailwind.css` is Tailwind v4 *without* preflight; do not add a second
  `@import "tailwindcss"`).

> ⚠️ Keep the two `@source` lines in `app/globals.css`. Without the explicit
> `node_modules` path, Tailwind never scans the published kit and the utilities used
> inside kit components won't be generated (broken layouts).

## Project structure

```
├── app/
│   ├── globals.css            # kit CSS imports + Tailwind @source (see warning)
│   ├── layout.tsx             # root layout — <title> is your app name
│   ├── page.tsx               # demo home page — replace with your app
│   └── components/
│       └── ThemeToggle.tsx    # dark mode via data-bp-theme + localStorage
├── next.config.ts             # Turbopack CSS loader (Tailwind v4)
└── tsconfig.json              # strict TypeScript (bundler resolution)
```

## Links

- Storybook (live playground): <https://storybook-static-khaki-two.vercel.app>
- npm package: <https://www.npmjs.com/package/@wakii/ui-kit>
