# AGENTS.md — rules for AI agents building an Astro app with React islands + @wakii/ui-kit

Astro + `@astrojs/react` + Tailwind v4 (`@tailwindcss/vite`). The kit runs inside **React islands**.
References: [Wakii repo AGENTS.md](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/AGENTS.md) ·
[Live Storybook](https://storybook-static-khaki-two.vercel.app).

## The island model (read carefully)

1. **Pages are `.astro`** (static, fast) — layout, typography and SEO live here.
2. **Kit components are `.tsx` imported into `.astro` with a hydration directive** — `client:load` for interactive parts (Table, Button), `client:visible` for below-the-fold content.
3. One island = ONE React tree — state does not cross islands; when it must, lift it into a single larger island.
4. Styles live in `src/styles/global.css` (4 kit imports + 2 `@source` lines) — import from the layout's frontmatter.
5. The dark toggle lives inside a client island — it sets the attribute on its wrapper/body.

## General rules (same as every Wakii app)

Tokens-only colors · sizes h-8/9/10 · radius lg/xl/pill · focus ring-accent/40 · icons only from the kit's `<Icon name>` · minimum a11y.

## Checking

`pnpm build` + verify islands actually hydrate (interactive content, not just static HTML) in light and dark.
