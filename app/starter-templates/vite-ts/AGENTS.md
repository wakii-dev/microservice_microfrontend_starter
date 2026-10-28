# AGENTS.md — rules for AI agents (and humans) working in this app

Demo app dogfooding **@wakii/ui-kit**. Read this BEFORE writing UI.
Full references: [Wakii repo AGENTS.md](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/AGENTS.md) ·
[20 recipes](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/docs/ai/recipes.md) ·
[Live Storybook](https://storybook-static-khaki-two.vercel.app) (the living API of every component).

## Structure

```
src/
├── App.tsx              # SHELL: nav + routes + footer + dark toggle
├── features/showcase/   # demo pages (home + about) — DELETE THIS FOLDER when starting a real product
├── Demo*.tsx            # extras pages (only when scaffolded with --extras) — delete together with showcase
├── theme.ts             # dark/light (localStorage → data-bp-theme)
└── styles.css           # tokens + Tailwind v4 + the 2 @source lines (do not touch)
```

Starting a real product: delete `features/showcase` + `Demo*.tsx`, add your routes in App.tsx, keep the shell.
Want the standard containers/ui/hooks/api architecture (TanStack Query + zod + MSW)? Re-scaffold with `--preset product`.

## Mandatory rules (violations are wrong, not a matter of taste)

1. **Tokens-only** — colors come from tokens: `bg-s1/s2/s3`, `text-ink/ink2/ink3`, `border-line`, `text-accent`, `bg-canvas`. Variants = token opacity (`bg-accent/10`). NO hex.
2. **Dark mode** — every color must read in BOTH modes; the toggle is already in App (data-bp-theme cascades).
3. **Z-index** — only `z-[var(--z-dropdown|popover|modal|toast|tooltip)]`.
4. **Focus** — `focus-visible:ring-2 focus-visible:ring-accent/40`.
5. **Sizes** — controls `h-8/9/10`; radius `rounded-lg` (controls) / `rounded-xl` (cards) / `rounded-pill`.
6. **Motion** — 150–200ms + easing tokens; reuse the built-in `bp-*` keyframes (see the hero in App.tsx).
7. **Icons** — only `<Icon name="…" />` from the kit's primeicons set. Never hand-draw SVG glyphs (the W logo is the sole exception).
8. **A11y** — icon-only buttons need `aria-label`; menus need `role=menu` + `aria-expanded`.

## Checking UI changes

`pnpm build` must pass + check BOTH light & dark (toggle at top right). Use kit components (Table/Tag/Badge…) as-is — do not restyle them.
