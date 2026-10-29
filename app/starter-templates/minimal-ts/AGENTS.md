# AGENTS.md — architecture rules for AI agents (and newcomers)

This file is the source of truth for the project STRUCTURE. Change the structure = update this file first,
code second. ESLint (`pnpm lint`) enforces most of these rules via
`eslint-plugin-boundaries` — a violation is a lint error, not a matter of taste.

## Working agreement (wakii ecosystem v0.2 — 2026-10-29)

- **Input gate**: AI asks ONCE for direction on large work, then runs autonomously; stops only for permissions/spending.
- **Quality = machine gates** (`pnpm build` + tests green = pass). No per-change human review.
- **This app is private** — no npm publish from here.
- **Multi-session**: small scoped commits; follow the upstream [WORKFLOW](https://github.com/wakii-dev/microservice_microfrontend_starter/blob/main/docs/WORKFLOW.md) when contributing back.

## Directory structure

```
src/
├── main.tsx            # Entry: styles.css → Providers → BrowserRouter → Router (wiring only)
├── env.ts              # Environment variables validated with zod — fail fast when wrong
├── styles.css          # Kit CSS (tokens/dark/base/tailwind) + @source — do NOT add styles here
├── app/                # App-tier wiring: providers, router, theme
│   ├── providers.tsx   # ErrorBoundary + UiKitProvider — add new providers here
│   ├── router.tsx      # Sticky header + lazy Routes (Suspense Skeleton)
│   └── theme.ts        # useAppTheme() — dark mode via data-bp-theme
├── routes/             # 1 file = 1 page (default-exported component), lazy-loaded
└── shared/
    ├── ui/             # Shared UI components (PageHeader…) — NO data fetching
    └── lib/            # Pure helpers (utils.ts) — no React, no DOM
```

## Import rules (enforced by eslint-plugin-boundaries)

The "may import" column lists what each layer is ALLOWED to import; anything outside the table is forbidden (default deny).

| From ↓ into → | `app/` | `routes/` | `shared/ui` | `shared/lib` | `env.ts` |
|---|---|---|---|---|---|
| `main.tsx` (entry) | ✅ | — | — | — | — |
| `app/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `routes/` | ❌ | — | ✅ | ✅ | ❌ |
| `shared/ui` | ❌ | ❌ | — | ✅ | ❌ |
| `shared/lib` | ❌ | ❌ | ❌ | ✅* | ❌ |

\* lib files may import each other within shared. Read the table backwards: `routes/` must NOT
import from `app/` (the router orchestrates routes, never the reverse); `shared/` is "cool" —
it knows nothing about app/routes, which is exactly why it stays reusable everywhere.

- Use the `@/` alias (→ `src/`) for internal imports (e.g. `@/shared/ui/PageHeader`).
- Single exception: `*.test.ts(x)` files may import freely (fixtures, internals).
- External packages (react, react-router, @wakii/ui-kit, zod…) are not bound by these rules.

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Route page | kebab-case file, default export | `routes/task-detail.tsx` → `export default function TaskDetailPage()` |
| Component | PascalCase matching the file | `PageHeader.tsx` → `PageHeader` |
| Hook | `use` + camelCase, same-name file | `useAppTheme` |
| Helper | camelCase | `cx` |
| Props type | `PascalCase + Props`, exported alongside | `PageHeaderProps` |
| Test | next to the file, `+ .test.ts(x)` | `home.test.tsx` |

When the project grows (multiple features with data/API/forms), upgrade to the
feature architecture of the `product` preset (run `pnpm create wakii-app --preset product` to see the reference):
`src/features/<name>/{containers,ui,hooks,api,schema}` — pages import only through
`features/<name>/index.ts`; the dependency flow is container → (hooks → api) → ui.

## Recipe — adding a new page (5 steps)

1. Create `src/routes/<name>.tsx` with the page as the default export. Pages only compose
   layout from `@wakii/ui-kit` + `@/shared/ui` — never import from `app/`.
2. Register the route in `src/app/router.tsx`: add `lazy(() => import('@/routes/<name>'))`
   + one `<Route element={…} path="/…" />` line.
3. Need a header link? Add a `NavLink` in `router.tsx` (see product-ts once you have >2
   routes — at that point switch to the kit's Menu/Sidebar).
4. Need backend data? Do not fetch inside the page — that is the signal to upgrade to the
   `features/` structure (see Naming above).
5. Write a test next to the file (`<name>.test.tsx`): render + assert by role/text, run
   `pnpm test`. Final gate: `pnpm lint && pnpm typecheck` green before commit.

## UI conventions (@wakii/ui-kit)

- Tokens-only: `bg-canvas/s1/s2/s3`, `text-ink/ink2/ink3`, `border-line`,
  `text-accent`, `bg-accent` — no hex in classNames.
- Dark mode cascades automatically via `data-bp-theme` (wired in `theme.ts`) — never
  write dark-specific code.
- Keep the `@source '../node_modules/@wakii/ui-kit/src'` + `…/dist` lines in
  `src/styles.css` — without them the kit's utilities are not generated (the UI breaks).
- Icons: `<Icon name="…" size={n} />` from the kit's set; z-index only as
  `z-[var(--z-…)]`; motion 150–200ms with easing tokens.
