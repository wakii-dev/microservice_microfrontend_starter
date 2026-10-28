# {{appName}}

A [React](https://react.dev) + [Vite](https://vite.dev) starter wired to
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — a Tailwind v4 design
system with 90+ components, hooks, dark theme and motion. Scaffolded by
`create-wakii-app`.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test     # vitest — demo App (shell + dark toggle đổi data-bp-theme)
```

The demo page dogfoods the kit: `Button` · `Tag` · `Alert` · `Table` · `Statistic`
+ `CountUp` · `Card` · `Typography` (`Title`/`Text`) · `Icon` · `Link` — plus a
working dark mode toggle in the top-right corner.

## How theming works

- `src/styles.css` imports the kit's CSS in a fixed order:
  **tokens → dark theme → base reset → tailwind utilities** (the kit's
  `styles/tailwind.css` is Tailwind v4 *without* preflight — the kit keeps its
  own reset in `base.css`; do not add a second `@import "tailwindcss"`).
- Dark mode = `data-bp-theme="dark"` on `<html>`. `src/theme.ts` exposes
  `useAppTheme()` — persisted in `localStorage` (`app-theme`) and synced to the
  document element, so every kit component re-themes through CSS variables
  instantly, no reload.
- Colors in your own markup use kit utilities: `bg-canvas`, `bg-s1/s2/s3`,
  `text-ink/ink2/ink3`, `border-line`, `text-accent`, `bg-accent` — they resolve
  at runtime from tokens and flip with the theme automatically.

> ⚠️ Keep `@source '../node_modules/@wakii/ui-kit/src';` in `src/styles.css`.
> The kit ships TS source; without that line Tailwind never scans it and the
> utilities used inside kit components won't be generated (broken layouts).

## Project structure

```
├── index.html              # Vite entry — <title> is your app name
├── src/
│   ├── main.tsx            # imports styles.css once, then renders <App />
│   ├── styles.css          # kit CSS imports + Tailwind @source (see warning above)
│   ├── theme.ts            # useAppTheme() — dark mode via data-bp-theme
│   └── App.tsx             # demo page — replace with your app
├── vite.config.ts          # @vitejs/plugin-react + @tailwindcss/vite
└── tsconfig.json           # strict TypeScript (bundler resolution)
```

## Links

- Storybook (live playground): <https://storybook-static-khaki-two.vercel.app>
- npm package: <https://www.npmjs.com/package/@wakii/ui-kit>
