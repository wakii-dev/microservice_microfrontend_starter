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
├── main.tsx            # Entry: MSW (dev) → styles.css → Providers → Router (wiring only)
├── env.ts              # Environment variables validated with zod — fail fast when wrong
├── styles.css          # Kit CSS (tokens/dark/base/tailwind) + @source — do NOT add styles here
├── app/                # App-tier wiring
│   ├── providers.tsx   # UiKitProvider → QueryClientProvider → ErrorBoundary
│   ├── query-client.ts # Shared TanStack Query instance (defaults live here)
│   ├── router.tsx      # Sticky header + lazy Routes (Suspense Skeleton)
│   └── theme.ts        # useAppTheme() — dark mode via data-bp-theme
├── routes/             # 1 file = 1 page (default export), lazy-loaded
├── features/           # EACH feature is one folder, self-contained by layers (below)
│   └── tasks/          # Sample feature — copy this structure for a new one
├── mocks/              # MSW: fake CRUD handlers + browser worker (DEV only)
└── shared/
    ├── api/            # client.ts (fetch wrapper) + query-keys.ts (factory)
    ├── ui/             # Shared UI components (PageHeader…) — NO data fetching
    └── lib/            # Pure helpers (utils.ts) — no React, no DOM
```

## Feature anatomy (`features/<name>/`)

```
features/tasks/
├── index.ts        # THE ONLY public exit — exports containers + ui
├── schema/         # zod schema: TS type + response parsing + form validation
├── api/            # tasks-api.ts: shared client + zod parse (PURE TS — no react)
├── hooks/          # useTasks (query + optimistic mutation), useTaskForm (kit useForm)
├── containers/     # wire hooks/api → ui via props (the ONLY layer touching data)
└── ui/             # presentational: takes props, never fetches
```

One-way dependency flow: `routes → index → containers → (hooks → api) → ui`;
every layer may read `schema/`.

## Import rules (enforced by eslint-plugin-boundaries)

The "may import" column lists what each layer is ALLOWED to import; anything outside the table is forbidden (default deny).

| From ↓ into → | `routes/` | `features/*/index` | `containers/` | `hooks/` | `api/` | `schema/` | `shared/api` | `shared/ui` | `shared/lib` | `env.ts` |
|---|---|---|---|---|---|---|---|---|---|---|
| `main.tsx` (entry) | — | — | — | — | — | — | — | — | — | — |
| `app/` | ✅ | — | — | — | — | — | ✅ | ✅ | ✅ | ✅ |
| `routes/` | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ | — | ✅ | ✅ | — |
| `features/*/index` | — | — | ✅ | — | ✅ | ✅ | — | — | — | — |
| `containers/` | — | — | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| `hooks/` | — | — | — | — | ✅ | ✅ | ✅ | ❌ | ✅ | — |
| `api/` | — | — | — | — | — | ✅ | ✅ | ❌ | ✅ | ✅ |
| `schema/` | — | — | — | — | — | — | — | ❌ | ✅ | — |
| `shared/api` | — | — | — | — | — | — | — | ❌ | ✅ | ✅ |
| `shared/ui` | — | — | — | — | — | — | — | — | ✅ | — |

- `routes/` may only reach a feature THROUGH `features/*/index.ts` — sneaking into
  `containers|ui|hooks|api` is a lint error (the message restates the correct rule).
  \* routes→routes: pages may share a layout that lives in `routes/` (e.g. an admin layout).
- `ui/` must not import `containers|hooks|api` (data is pumped in via props — UI stays pure).
- `hooks/` must not import `ui/` (hooks return data/state, they never render).
- `api/` must not import react/react-dom (overridden `no-restricted-imports` — pure TS layer).
- `shared/` is "cool": it never imports back up into app/routes/features.
- Single exception: `*.test.ts(x)` files may import freely.
- Internal imports use the `@/` alias (→ `src/`); within a feature use relative paths
  (`../schema/schema`).

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Route page | kebab-case file, default export | `routes/task-detail.tsx` |
| Container | `XxxContainer` — paired with UI `Xxx` | `TasksPageContainer` ↔ `TasksPage` |
| UI component | PascalCase matching the file | `TaskForm.tsx` → `TaskForm` |
| Hook | `useXxx`, same-name file | `useTasks` |
| Feature API | `<name>-api.ts`, object `<name>sApi` | `tasks-api.ts` → `tasksApi` |
| Schema | a single `schema.ts` per feature | `taskSchema`, `taskFormSchema` |
| Query keys | `createQueryKeys('<resource>')` | `tasksKeys.list()` |
| Test | next to the file, `+ .test.ts(x)` | `useTasks.test.tsx` |

The tasks feature ships sample tests per layer: api (msw node + zod), hooks
(renderHook + QueryClient wrapper), ui (RTL with fixed props) — copy them for a new feature.

## Recipe — adding a new feature (5 steps)

1. Create `features/<name>/` following the anatomy above (copying `tasks/` is fastest);
   write the schema FIRST — the zod schema is the data contract every layer codes against.
2. Write `api/<name>-api.ts`: call `apiFetch` from `@/shared/api/client` + zod parse
   + export `xxxKeys = createQueryKeys('<name>s')`.
3. Write hooks: list query + mutations (optimistic when sensible), a form hook if needed.
4. Write `ui/` as pure props → `containers/` wiring data → export everything via `index.ts`.
5. The page uses the feature: `routes/<page>.tsx` imports `{ ...Container }` from
   `@/features/<name>` + register the route in `app/router.tsx`. Write the 3 tests
   (api/hooks/ui) next to their files. Final gate: `pnpm lint && pnpm typecheck && pnpm test`.

## Data layer — how it runs

- **MSW (mocks)**: runs automatically in dev (`main.tsx` enables it when `import.meta.env.DEV`) —
  handlers live in `src/mocks/`, data resets on every reload. To hit a real backend: set
  `VITE_API_URL` in `.env.local` (MSW still runs in dev — remove the dynamic import in main
  to disable), or build for production (mocks are not in the bundle).
- **client.ts**: every call goes through it — baseURL from env, 8s timeout, error envelope
  `{ message }` thrown as `ApiError` (catch by `status`).
- **query-keys**: invalidate by prefix — `tasksKeys.lists()` invalidates every list
  without touching details.
- `public/mockServiceWorker.js` is generated by `pnpm exec msw init public/` — rerun that
  command whenever you upgrade msw.

## UI conventions (@wakii/ui-kit)

- Tokens-only: `bg-canvas/s1/s2/s3`, `text-ink/ink2/ink3`, `border-line`,
  `text-accent`, `bg-accent` — no hex in classNames.
- Dark mode cascades automatically via `data-bp-theme` (wired in `theme.ts`).
- Keep the `@source '../node_modules/@wakii/ui-kit/src'` + `…/dist` lines in
  `src/styles.css` — without them the kit's utilities are not generated (the UI breaks).
- Forms: `useForm` + zod schema + `Field` + `Input` (kit recipe 1) — see
  `useTaskForm` + `TaskForm` as the reference.
- Icons: `<Icon name="…" size={n} />`; z-index only `z-[var(--z-…)]`; motion
  150–200ms with easing tokens.
