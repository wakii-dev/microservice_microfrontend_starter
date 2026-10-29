# AGENTS.md — rules for AI agents (and humans) working in this app

JS variant of the demo app dogfooding **@wakii/ui-kit** — same rules as the TS variant.
Full references: [Wakii repo AGENTS.md](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/AGENTS.md) ·
[20 recipes](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/docs/ai/recipes.md) ·
[Live Storybook](https://storybook-static-khaki-two.vercel.app).

## Working agreement (wakii ecosystem v0.2 — 2026-10-29)

- **Input gate**: AI asks ONCE for direction on large work, then runs autonomously; stops only for permissions/spending.
- **Quality = machine gates** (`pnpm build` + tests green = pass). No per-change human review.
- **This app is private** — no npm publish from here.
- **Multi-session**: small scoped commits; follow the upstream [WORKFLOW](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/docs/WORKFLOW.md) when contributing back.

## Structure

```
src/
├── App.jsx             # SHELL: nav + routes + footer + dark toggle
├── features/showcase/  # demo pages — DELETE THIS FOLDER when starting a real product
├── theme.js            # dark/light (localStorage → data-bp-theme)
└── styles.css          # tokens + Tailwind v4 + the 2 @source lines (do not touch)
```

## Mandatory rules

1. **Tokens-only** — `bg-s1/s2/s3`, `text-ink/ink2/ink3`, `border-line`, `text-accent`, `bg-canvas`. NO hex.
2. **Dark mode** — every color must read in BOTH modes (toggle already wired).
3. **Z-index** — only `z-[var(--z-dropdown|popover|modal|toast|tooltip)]`.
4. **Focus** — `focus-visible:ring-2 focus-visible:ring-accent/40`.
5. **Sizes/radius** — controls `h-8/9/10`; `rounded-lg` controls / `rounded-xl` cards / `rounded-pill`.
6. **Icons** — only `<Icon name="…" />` from the kit. Never hand-draw SVG glyphs (W logo excepted).

## Checking

`pnpm build` clean + verify BOTH light & dark. Use kit components as-is.
