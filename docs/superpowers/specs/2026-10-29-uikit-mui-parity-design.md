# ui-kit MUI-parity — Design Spec

- **Linear**: VU-65 · **Branch**: `wakii-dev/feat-uikit-mui-parity` · **Status**: Approved (design decisions gated with user 2026-10-29)
- **Direction**: A — all 5 components in one Epic (user-approved at Phase 0 gate)
- **Baseline**: MUI-parity audit 2026-10-29, source-verified (114 component dirs vs mui.com official list)

## 1. Problem

MUI-parity audit found 4 missing components + 1 feature gap. Consuming apps (shell, remote-tasks, remote-activity, starter templates) hit these gaps and hand-roll off-token UI. This epic closes the gaps in one minor release: ui-kit 0.7.2 → 0.8.0.

## 2. Scope

**In**: (1) Textarea `autoSize`, (2) `ButtonGroup`, (3) `ImageList` standard + masonry, (4) `Portal` standalone, (5) `Progress` circular shape, (6) shared chores — barrel exports, CHANGELOG, AGENTS.md Part II tables, `docs/ai/recipes.md`, version 0.8.0.

**Out** (follow-up missions, not this epic): Portal retrofit into Drawer/Tooltip/Message/Backdrop; npm publish + starter-template pin bump (`^0.7.x` caret does not jump minor on 0.x — needs create-wakii-stack patch publish); quilted/woven ImageList variants; responsive `cols` breakpoints.

## 3. Approved design decisions (user-gated)

| Decision | Choice | Rejected alternative |
|---|---|---|
| Textarea autosize technique | JS `scrollHeight` measure — antd parity, all browsers, precise row clamp | CSS `field-sizing: content` (Chrome 123+ only, no row clamp) |
| Masonry technique | CSS multi-column — exact MUI mechanics, 0 JS | JS shortest-column balancer (deviates from MUI, more test surface) |
| Circular progress API | `shape: 'line' \| 'circle'` prop on existing `Progress` (antd `type` semantics) | Separate `CircularProgress` export; `Progress.Circle` subcomponent |
| ImageList variants | standard + masonry only | Full MUI parity (quilted/woven — niche) |

## 4. Component designs

### 4.1 Textarea `autoSize` (P0) — modify `ui/input/`

```tsx
autoSize?: boolean | { minRows?: number; maxRows?: number }
```

- On mount + every value change: reset `height:auto` → read `scrollHeight` → clamp to `[minRows, maxRows]` via measured `lineHeight` → set `style.height`. `maxRows` reached → `overflow-y:auto`, else `overflow:hidden`.
- `autoSize: true` ≡ `{ minRows: 2 }` — unbounded growth, no max clamp. Explicit `{ minRows, maxRows }` clamps.
- Coexists with `showCount` + `maxLength` + `invalid` + `classNames` slots (SÓNG-3). Controlled AND uncontrolled `value` both handled.
- **Tests (behavioral)**: typing wrapped text grows height; height clamps at maxRows (overflow-y switches to auto); minRows floor on empty; `rows` prop ignored when autoSize on; works with showCount.
- **Stories**: default, autoSize boolean, autoSize {minRows,maxRows}, autoSize+showCount+maxLength, invalid.

### 4.2 ButtonGroup (P1) — extend `ui/button/`

```tsx
<ButtonGroup size?: ButtonSize orientation?: 'horizontal' | 'vertical' aria-label>
  <Button …/>…
</ButtonGroup>
```

- Context passes `size` (and default `type`) to child Buttons. Attached chrome: first/last keep outer `rounded-lg` corners, middle buttons square, `-ml-px` seam (no double border), vertical mirrors on the block axis.
- `role="group"` + `aria-label` REQUIRED (a11y rule 10 — icon-only buttons inside). `focus-visible:ring-accent/40` untouched per-button.
- **Tests**: N buttons render with joined-border classes per position; size context propagates (child without explicit size inherits); orientation vertical switches axis classes; role/aria present.
- **Stories**: 3 buttons default, sizes s/m/l, vertical, mixed types, with icons.

### 4.3 ImageList (P1) — new `ui/image-list/`

```tsx
<ImageList items: ImageItem[] cols?: number gap?: number variant?: 'standard' | 'masonry' renderItem? />
interface ImageItem { src: string; alt: string; caption?: string }
```

- `standard`: CSS grid, `grid-template-columns: repeat(cols, 1fr)`, `gap` token spacing, fixed row height (`--img-row-h` derived from size class) with `object-fit: cover`.
- `masonry`: `column-count: cols`, `column-gap`, items `break-inside: avoid`. Documented caveat (MUI-identical): visual order flows top-to-bottom per column.
- Item = `<figure>` + `<img alt>` + optional `<figcaption>`. Click → `onItemClick?(index)` (keyboard reachable, Enter/Space). Reuses `Image` zoom? NO — plain img this round (zoom composition stays with `UiImage` in consumer land).
- **Tests**: standard renders N figures in grid class with cols; masonry renders column-count style; caption/alt present; keyboard Enter triggers onItemClick.
- **Stories**: standard 3-col photos, masonry mixed heights, with captions, gap variants.

### 4.4 Portal (P2) — new `ui/portal/`

```tsx
<Portal container?: HTMLElement | (() => HTMLElement)>…</Portal>
```

- `createPortal(children, container)`; default `document.body`. `undefined` container OR SSR-guard (no `document`) → render inline (no portal). No styling, no stacking logic — pure primitive; Modal/Drawer keep their internal portals (retrofit is out of scope).
- **Tests**: children land in document.body by default; custom container honored; function container lazy-evaluated once per render; inline fallback when container null.
- **Stories**: default body portal (DOM-assert + visible box), custom container.

### 4.5 `Progress` shape circular (P2) — modify `ui/progress/`

```tsx
shape?: 'line' | 'circle'  (default 'line') · size?: number (circle px, default 40) · percent · status · showInfo
```

- Circle: SVG `r` from size, `stroke-dasharray = C × percent/100`, `stroke-linecap: round`, track `--line` + bar `--accent` (token classes only — no hex), rotate -90° origin center. `percent` undefined → indeterminate: `animate-[spin]` with motion token + `prefers-reduced-motion` honored (global block).
- `role="progressbar"` + `aria-valuenow={percent}` + `aria-valuemin/max` + `aria-label` from `label` prop (or visible text). `showInfo` renders centered % text.
- **Tests**: line default unchanged (regression); circle renders SVG with dasharray = expected fraction; aria-valuenow set; status=exception recolors (token class); indeterminate class when percent undefined.
- **Stories**: line (regression), circle determinate 0/40/100, circle indeterminate, statuses, sizes.

## 5. Shared chores (final task, depends on all 5)

- Barrel `src/index.ts`: exports + type-only for each new API (follow existing export style).
- `CHANGELOG.md` 0.8.0 entry; `package.json` 0.7.2 → 0.8.0.
- `AGENTS.md` Part II: ButtonGroup row (Layout/menu family), ImageList row (Data Display), Portal row (General), Progress row update (shape circle), Textarea row update (autoSize).
- `docs/ai/recipes.md`: new recipe(s) — autosize form textarea + gallery page (ImageList masonry) usage blocks.
- NOT in scope: publishing, template pin bumps (follow-up).

## 6. Non-functional

- **Tokens-only** everywhere (mandatory rule 1) — no hex/arbitrary colors; circle colors via CSS vars.
- **a11y** rule 10 minimums per component (listed above).
- **Motion** rule 6: indeterminate spin uses easing/duration tokens; reduced-motion auto-disable.
- **Backward-compat**: all additive; existing 1503 tests must stay green.
- **Sizes** rule 5 unaffected (circle `size` is px diameter, not control height class).

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| autosize loop (height change → scrollHeight change) | measure with `box-sizing: border-box` + single rAF write; test asserts height stabilizes |
| ButtonGroup context leaking to non-Button children | context consumer only inside Button; unknown children render untouched |
| masonry `break-inside` on old Safari | standard variant is default; masonry documented as progressive |
| story TS2322 trap (meta `component:` + render-only) | meta WITHOUT `component:` for render-only stories (image.stories pattern) |
| barrel import cycles (Portal ← others) | Portal depends on nothing; others don't import it |

## 8. Acceptance criteria (gate per task + final)

1. Per component: behavioral tests RED→GREEN (not smoke-render), story matrix ≥4 stories, ≥1 `export const` per file.
2. Full suite green + `pnpm verify:quick --json` exit 0 in the worktree.
3. Browser verify (Rule 0): Storybook :6006 shows every new story; ZCode screenshots before/after.
4. Docs/CHANGELOG/version chores committed; diff review clean (no hex, no off-token className).
5. Worker protocol: each task executed by a terminal worker; ZCode gates + reviews diffs (audit-skill bar: behavior tests, story matrix, tokens).
