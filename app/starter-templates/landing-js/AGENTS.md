# AGENTS.md — rules for AI agents (and humans) working in this landing — JS variant

Single-page motion showcase built on **@wakii/ui-kit** (Reveal · CountUp · Parallax · CollapseTransition).
References: [Wakii repo AGENTS.md](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/AGENTS.md) ·
[Live Storybook](https://storybook-static-khaki-two.vercel.app).

## Working agreement (wakii ecosystem v0.2 — 2026-10-29)

- **Input gate**: AI asks ONCE for direction on large work, then runs autonomously; stops only for permissions/spending.
- **Quality = machine gates** (`pnpm build` + tests green = pass). No per-change human review.
- **This app is private** — no npm publish from here.
- **Multi-session**: small scoped commits; follow the upstream [WORKFLOW](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/docs/WORKFLOW.md) when contributing back.

## Structure

```
src/
├── App.jsx        # THE WHOLE PAGE: hero (Parallax + blob) → KPIs (Statistic + CountUp)
│                  #   → sections (Reveal stagger, delays 0/150/300) → FAQ (CollapseTransition) → CTA
├── theme.js       # dark/light toggle
└── styles.css     # tokens + @source — do not touch
```

No router, no data layer — add state only via `useState`/props.

## Landing-specific rules

1. **Motion via the kit**: entrances use `<Reveal direction delay>`; counters use `<CountUp>`; FAQ open/close uses `CollapseTransition`. Reduced-motion is handled automatically — do not roll your own.
2. **Standard stagger**: adjacent sections take delays 0 / 150 / 300 (ms).
3. Tokens-only colors (same as the main AGENTS.md); the hero blob is `bg-accent/10..20 + blur-3xl` — no hex.
4. Swapping in a real image: replace the blob with `<UiImage>` (click-to-zoom built in).
5. SEO: meta lives in `index.html` (description + og: tags are set) — add og:image once you have one.

## Checking

`pnpm build` clean; check light + dark; scroll through each section to see Reveal fire (once, not looping).
