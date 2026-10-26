# {{appName}}

An [Astro](https://astro.build) + [React](https://react.dev) starter wired to
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — a Tailwind v4 design system
with 90+ components, hooks, dark theme and motion. Scaffolded by `create-wakii-app`.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # static output in dist/
pnpm preview  # serve the production build
```

The home page dogfoods the kit: sticky brand header (W mark) · dark mode toggle ·
`Alert` ×4 severities · `Card` · `Table` with `Tag` status · `Statistic` + `CountUp` ·
`Button` ×2 · `Title`/`Text`.

## Notes for this stack

- **React islands**: kit components only render inside a React island — a static `.astro`
  page can't render them directly. `src/pages/index.astro` is a thin static shell and
  mounts the whole demo as `<KitDemo client:load />` (`src/components/KitDemo.tsx`).
- **Dark mode**: the toggle in `KitDemo.tsx` persists `app-theme` in `localStorage` and
  syncs `data-bp-theme` on `<html>` — every kit component re-themes through CSS variables
  instantly, no reload. Storage is read after mount, so the server-rendered island and the
  first hydration always match.
- **Tailwind v4**: `src/styles/global.css` imports the kit CSS in a fixed order —
  **tokens → dark theme → base reset → tailwind utilities** (the kit's
  `styles/tailwind.css` is Tailwind v4 *without* preflight; do not add a second
  `@import "tailwindcss"`). Tailwind runs through `@tailwindcss/vite` in
  `astro.config.mjs`.

> ⚠️ Keep the two `@source` lines in `src/styles/global.css`. Without the explicit
> `node_modules` path, Tailwind never scans the published kit and the utilities used
> inside kit components won't be generated (broken layouts).

## Project structure

```
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── KitDemo.tsx        # React island — the whole demo page
│   ├── pages/
│   │   └── index.astro        # static shell — mounts <KitDemo client:load />
│   └── styles/
│       └── global.css         # kit CSS imports + Tailwind @source (see warning)
├── astro.config.mjs           # react() integration + tailwindcss() vite plugin
└── tsconfig.json              # extends astro/tsconfigs/strict
```

## Links

- Storybook (live playground): <https://storybook-static-khaki-two.vercel.app>
- npm package: <https://www.npmjs.com/package/@wakii/ui-kit>
