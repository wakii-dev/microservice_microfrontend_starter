# AGENTS.md — rules for AI agents building a Next.js app with @wakii/ui-kit

Next.js App Router + **@wakii/ui-kit** (verified on Next 16 — no transpilePackages needed).
References: [Wakii repo AGENTS.md](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/AGENTS.md) ·
[Live Storybook](https://storybook-static-khaki-two.vercel.app).

## Next-specific rules (read carefully — different from Vite)

1. **Every page using the kit must start with `'use client'`** (the kit is a client-side component library).
2. **Styles**: keep `app/globals.css` exactly as-is — 4 kit imports + the 2 `@source` lines (Tailwind v4 scans the kit dist). Do NOT `@import "tailwindcss"` a second time.
3. No `transpilePackages` config needed — the package is standard ESM.
4. The dark toggle is a client component (useState + `data-bp-theme` on a wrapper, or on `<html>` via an effect).
5. New route = new folder under `app/` (`page.tsx` + `'use client'` when it uses the kit).

## General rules (same as every Wakii app)

Tokens-only colors (`bg-s1`, `text-ink2`, `border-line`, `text-accent`…) · sizes h-8/9/10 · radius lg/xl/pill · focus `ring-accent/40` · icons only from the kit's `<Icon name>` · minimum a11y.

## Checking

`pnpm build` (static prerender must be hydration-clean) + check light/dark.
