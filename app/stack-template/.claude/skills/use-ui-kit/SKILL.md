---
name: use-ui-kit
description: Use when writing/building UI with @wakii/ui-kit — "which component for X", "customize a component", "import chart/carousel", "dark mode", "a11y/token/UI-test errors". Task-based component map + tokens + customize + subpaths + a11y + pitfalls. Do NOT use for BE/contract work, or for editing ui-kit itself (that is a regular ui-kit story — AGENTS.md Part II is the rules source).
---

# use-ui-kit — use @wakii/ui-kit CORRECTLY

## Overview

If-then directives for AI CONSUMING ui-kit. Sources of truth: `app/ui-kit/src/ui/` (115 component dirs) · `app/ui-kit/src/templates/` (template stories: auth · crud · dashboard · kanban-project · landing · parallax-landing · settings) · [app/ui-kit/USAGE.md](../../../app/ui-kit/USAGE.md) · hard rules in [AGENTS.md Part II](../../../AGENTS.md). Copy-paste samples: [docs/ai/recipes.md](../../../docs/ai/recipes.md).

## 1. Task-based component map

IF you need X THEN use the component + key props + compare against the REAL story id (ids come from `app/ui-kit/storybook-static/index.json`, 966 entries; id rule: `<section>-<component>--<story>`, story file at `src/ui/<dir>/<name>.stories.tsx`):

| Want | Component | Key props | Reference story |
|---|---|---|---|
| Button + variants/loading | `Button` | `variant`, `loading`, `block` | `primitives-button--basic` |
| CRUD table sort/filter/paginate | `Table` | `columns` (`sortable`/`filterable`/`render`), `virtual` | `data-display-table--column-resize` |
| Basic input + affix | `Input` (+`Input.Search`) | `invalid`, `prefix`/`suffix` | `forms-input--affix` |
| Pick one of many | `Select` / `CascadeSelect` (tree) | `options`, controlled `value` | `forms-cascadeselect--basic` |
| Pick date/time | `DatePicker` | `range`, `showTime`, `locale` | `forms-datepicker--basic` |
| Blocking dialog | `Modal` | `open`, `onOk`/`onCancel`, `danger`, `confirmLoading` | `feedback-modal--basic` |
| Short toast | `message` (static API) | `message.success\|error(content)` | `feedback-message--custom-styled` |
| Tabs switching panels | `Tabs` / `Segmented` (no panels needed) | `items`, controlled `activeKey` | `navigation-tabs--controlled` |
| App sidebar | `Sidebar` + `Menu` | `collapsed`, multi-level items | `navigation-sidebar--basic` |
| Big-number KPI | `Statistic` | `value`, `prefix`/`suffix`, `valueStyle` | `data-display-statistic--basic` |
| Chart | `Chart` (subpath!) | `config` (chart.js), `fallback` | `data-display-chart--bar` |
| Complete screens | templates | — | `templates-crud-table--full-demo` |

IF not found in the table THEN look up `USAGE.md` (the "Per-component reference" part) or grep story ids in `storybook-static/index.json` — NEVER invent an id.

## 2. Tokens rules

- IF you need color THEN ONLY tokens from `src/styles/tokens.css`: `--c-canvas`, `--c-s1/s2/s3` (surfaces) · `--ink/--ink2/--ink3/--ink4` (text) · `--line/--line2` (borders) · `--accent/--accent-hi` · status `--st-done/doing/fail` — via the existing utilities (`bg-s1`, `text-ink2`, `border-line`, `text-accent`). No hex/`rgba()`/arbitrary values; need a variant → token opacity (`bg-accent/10`).
- IF you need z-index THEN only `z-[var(--z-dropdown|popover|modal|toast|tooltip)]` — hardcoded numbers forbidden.
- IF radius/shadow/motion THEN tokens: `rounded-lg/xl/pill` · `var(--shadow-pop|lift)` · 150–200ms + `var(--ease-enter|exit)`.
- IF dark mode THEN never code dark separately — `UiKitProvider theme="dark"` (or the `data-bp-theme="dark"` attribute on an ancestor); the host imports `@wakii/ui-kit/styles/themes/dark.css` EXACTLY ONCE (tokens cascade).
- IF you think a new token is needed THEN do NOT add it yourself — flag the coordinator (tokens.css: "do not invent new tokens").

## 3. Customize pass

- IF you need to adjust DOM classes THEN use the `classNames` slot prop (antd v5-style) — every component has `root` + sub-parts (`Input`: `input`/`prefix`/`suffix`; `Card`: `header`/`body`…) + `style` passthrough. Import the `<Comp>ClassNames` type from the barrel.
- IF writing a component that takes a `classNames` prop THEN do NOT destructure it directly (`{classNames}`) when the file imports the `classnames` helper — shadowing causes a runtime TypeError (gotcha fixed in #149) → use `props.classNames`.
- IF merging/overriding classes THEN write each variant EXPLICITLY — no tailwind-merge, no conditional string surgery (utilities easily contradict; Part II anti-pattern).

## 4. Subpath imports

- IF importing a heavy component THEN use the exact subpath from the package.json `exports` — NOT in the main barrel: `@wakii/ui-kit/carousel` · `/chart` · `/schedule` · `/editor` · `/experience3d`. Corresponding types remain type-only exports from the barrel.
- IF using a subpath THEN install the peer-dep yourself: `swiper` (carousel) · `chart.js` (chart) · `@fullcalendar/*` (schedule) · `@tiptap/*` (editor) — every subpath accepts a `fallback` prop when the peer is missing.

## 5. Mandatory a11y

- IF an icon-only button THEN `aria-label`. IF a menu THEN `role=menu/menuitem` + `aria-expanded`. IF selected THEN `aria-current`. IF a switch THEN `role="switch"` + `aria-checked`. IF a decorative icon THEN `aria-hidden`.
- IF focus THEN `focus-visible:ring-2 focus-visible:ring-accent/40` — no ring-offset, no off-standard `outline-2`.
- IF a Spinner THEN `label` is mandatory (aria-label); IF modal/drawer THEN focus trap + scroll lock are built in — never re-implement.

## 6. Pitfalls

- IF the FE uses react-query THEN ONE QueryClient at the host (`app/shell/src/App.tsx`, module-level); in-shell remotes never create their own (split cache = create a task and the feed never sees it); rspack shares `@tanstack/react-query` symmetrically shell↔remote.
- IF motion/reveal THEN never animate outside the tokens — `prefers-reduced-motion` auto-disables via the global block; `Parallax`/`Reveal` self-guard via `useMediaQuery` — never double-wrap.
- IF writing component tests THEN jsdom lacks `matchMedia` — a no-op stub already exists in `app/ui-kit/tests/setup.ts`; `IntersectionObserver` is missing too — components self-fallback, tests needing IO mock it like `MockIO` in `src/ui/reveal/reveal.test.tsx`; never assume browser APIs exist in jsdom.
- IF adding a story file THEN it needs ≥1 `export const` story (the indexer drops files with 0); NEVER attach `component:` to meta when stories only have `render` and the component has required props (TS2322 blocks push — Part II anti-pattern).
