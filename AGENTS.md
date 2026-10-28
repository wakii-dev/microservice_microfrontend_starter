# AGENTS.md — rules for AI agents (Claude / Codex / Cursor / …)

Repo: mixed-stack services (Node/Spring/Go) + Module Federation FE (Rspack); browsers touch only the gateway :8080. This file = **if-then directives** — apply verbatim; IF a case has no rule THEN follow §0; IF a rule conflicts with your brief THEN ask the lead, NEVER edit rules yourself.

## 0. Reading order

IF new to the repo THEN read in this order; IF the task is docs-only THEN skip 4–5:

| # | Read | Condition |
|---|---|---|
| 1 | AGENTS.md (this file) | always |
| 2 | [CLAUDE.md](CLAUDE.md) | always — repo map + daily commands |
| 3 | [docs/walkthrough.md](docs/walkthrough.md) | IF running the demo for the first time |
| 4 | [platform/conventions/01–09](platform/conventions/README.md) | IF coding a service — mandatory |
| 5 | [docs/adr/0001–0010](docs/adr/README.md) | IF you need architecture rationale |
| 6 | [docs/ai/knowledge.md](docs/ai/knowledge.md) | IF hitting a trap / need a task→file map |
| 7 | [docs/ai/recipes.md](docs/ai/recipes.md) | IF writing UI |

## 1. Git directives

- IF creating a branch THEN the name must match `^wakii-dev/(story|sf|fix|docs|chore|feat)-[a-z0-9][a-z0-9-]*$` — slug: lowercase + `-` only; no `.`, `_`, uppercase. pre-push rejects otherwise.
- IF `main` needs a change THEN open a PR; the lead merges **squash** (one commit per PR on main). NEVER push straight to main. Details: [docs/git-flow.md](docs/git-flow.md).
- IF committing THEN the message is `<type>(<scope>): <description>`, type ∈ `feat|fix|refactor|docs|test|chore|style|perf|build|ci|revert`.
- IF type = `fix` THEN the body records root cause + evidence.
- IF pushing THEN wait for the pre-push FE checks (minutes, per changed path vs `origin/main`) — do NOT kill mid-run.

## 2. Multi-session directives

- IF starting a mission THEN `git fetch origin && git worktree add /tmp/wt-<name> -b wakii-dev/<type>-<slug> origin/main`. NEVER use a shared worktree.
- IF a shared worktree has another session running on it THEN do NOT checkout/switch branches there.
- IF starting work THEN `git fetch origin && git log --oneline -5 origin/main` — a branch cut from stale main = conflicts / overwrites someone's PR.
- IF staging THEN `git add <explicit-path>`; `git add -A` is forbidden (the tree may hold another session's WIP).
- IF the mission is done THEN verify → report → stop → close the session (a lingering session risks rogue pushes).

## 3. Verify directives

- IF code changed THEN run `pnpm verify:quick` — the script picks steps per changed path; exit code 0 = PASS. (Landing via the verify lane — if missing at your commit, use the table below.)
- IF working in a scaffolded project (create-wakii-stack) THEN `git init && git add -A && git commit -m "init"` FIRST — verify:quick needs git; a `.gitignore` ships with the scaffold (node_modules/.env excluded), so `git add -A` is safe there.
- IF a program/agent needs to read results THEN `pnpm verify:quick --json` → `[{step, status, duration}]` + exit code. **JSON is the primary contract**; the default text output is for humans — do not parse it. For a parseable stream run the script DIRECTLY (`bash scripts/verify-quick.sh --json`) — through the `pnpm` wrapper the banner lines land on stdout too.
- IF verifying through a pipe (`cmd | tail`) THEN `$?` belongs to the LAST command — conclude PASS only from the real exit code or `--json`.
- IF installing node-svc / auth-svc THEN `cd services/<svc> && pnpm install --frozen-lockfile --ignore-workspace` (standalone lockfile).

IF verify:quick is unavailable THEN run per package:

| Package | Command |
|---|---|
| shell | `pnpm --filter shell test && pnpm --filter shell typecheck` |
| ui-kit | `pnpm --filter ui-kit test` |
| remote-tasks / remote-activity | `pnpm --filter remote-tasks test` · `pnpm --filter remote-activity test` |
| node-svc / auth-svc | `pnpm --filter node-svc test` · `pnpm --filter auth-svc test` |
| go-svc / spring-svc | `cd services/go-svc && go test ./...` · `cd services/spring-svc && ./mvnw test` |
| contracts | `pnpm lint:contracts` |
| e2e full | `bash scripts/smoke/e2e.sh` |

## 4. Generator directives

- IF a new service / app / feature is needed THEN `pnpm gen:service <name> [--db shared|dedicated]` · `pnpm gen:app <name> [--remote]` · `pnpm gen:feature <name> --app <app>` — run from repo root (`pnpm install` first: scripts import `yaml`); `--root <dir>` to target a copy; `--json` → `{created, modified, next_steps}` — execute next_steps verbatim. Remove: `pnpm remove:service <name>` (core services refused).
- IF a program needs the result THEN add `--json` → `{"created": [<files>], "modified": [<files>], "next_steps": [<directives>]}`. `next_steps` = AI-executable follow-up directives (path + action) — NOT instructions for human readers.

## 5. Demo + ports

| Component | Port |
|---|---|
| **nginx gateway** | **8080** — the only port browsers/FE ever touch |
| shell (MF host) | 3000 · remote tasks 4001 · remote activity 4002 |
| node-svc 3001 · spring-svc 8081 · go-svc 8082 · auth-svc 8090 | postgres 5432 |

- IF changing a port THEN change all 4 places in one commit: conventions/05 + `.env.example` + compose + README (source of truth: [platform/conventions/05-ports.md](platform/conventions/05-ports.md)).
- IF running the demo THEN use `run.compose` in [orca.yaml](orca.yaml) — create topics `task-events` + `task-events.dlq` BEFORE booting services; verify with `bash scripts/smoke/e2e.sh`; open http://localhost:8080. IF not using compose THEN [docs/walkthrough.md](docs/walkthrough.md).
- IF logging into the demo THEN `alice@demo.local` / `demo-password` (fixture: [contracts/auth/users.json](contracts/auth/users.json)).
- IF demoing the saga THEN assign a task to `fail@demo.local` → "Assignment failed" badge + event lands in `task-events.dlq`.
- IF visual truth is needed THEN `pnpm --filter ui-kit storybook` → http://localhost:6006.

## 6. Traps — IF … THEN … (details: [docs/ai/knowledge.md](docs/ai/knowledge.md))

- IF npx/pnpm shows a stale version right after publish THEN the registry needs 2–5 minutes to propagate — verify with `npm view <pkg>`, do NOT re-publish.
- IF a Kafka consumer boots before its topic exists THEN assignment stays empty forever (no crash) — create topics first (`kafka-init` + `EnsureTopics`).
- IF verifying through `| tail`/`| head` THEN the exit code is swallowed — phantom PASS.
- IF publishing a tarball with hand-rolled copies THEN files go missing — `npm pack` + inspect the tarball before publishing.
- IF `EADDRINUSE` / oddly stale UI THEN an old dev server is still hanging around — `lsof -iTCP:<port> -sTCP:LISTEN` + kill the PID.
- IF 2 docker builds run in parallel THEN the engine overloads/crashes mid-build — build sequentially.
- IF a branch slug contains `.`/uppercase THEN it only fails at push — fix immediately with `git branch -m`.
- IF `app/ui-kit/.storybook/manager-head.html` turns dirty THEN the badge was auto-generated (`scripts/stamp-build.cjs`) — do NOT commit it.
- IF date/month tests flip red/green oddly THEN the TZ pin in `vitest.config.ts` (`test.env`) was dropped/missing — keep the pin.

## 7. Publish directives (npm packages — upstream only)

- IF publishing a package (`@wakii/ui-kit` · `create-wakii-app` · `create-wakii-stack`) THEN use the CI workflow **`publish-packages`** (GitHub → Actions tab → *publish-packages* → Run workflow; inputs: `package` + `version_type` = patch/minor/major). Pipeline: gate (verify on FRESHEST main) → bump (version + CHANGELOG entry auto-generated from the commit range, committed to main) → publish (`NPM_TOKEN` secret) → registry verify (wait for 2–5 min propagation, never trust an immediate `npm view`). Official publishes go through CI ONLY — local publishes from stale checkouts caused the 0.1.9 / 0.2.5 incidents. Details: [docs/WORKFLOW.md §4](docs/WORKFLOW.md).
- IF running a local publish script (`app/<pkg>/scripts/publish-npm.sh`) THEN it is for DEBUGGING only: it refuses to run when the git tree is dirty, the branch is not `main`, or HEAD ≠ origin/main; pass `--force-local` to override deliberately.
- IF a CI publish reports that the target version already exists THEN the run SKIPS cleanly (nothing is published, nothing overwritten) — fix the stale `version` on main first, then re-run.

## 8. UI

IF writing UI THEN read Part II (end of this file) + [docs/ai/recipes.md](docs/ai/recipes.md); compare against Storybook :6006. ui-kit is consumed from source — edits show instantly.

---

# Part II — Design system `@wakii/ui-kit` (quick reference for AI)

Read this part BEFORE writing UI with ui-kit. Full copy-paste recipes:
[docs/ai/recipes.md](docs/ai/recipes.md). Living API: Storybook :6006. Behavior changes:
[app/ui-kit/CHANGELOG.md](app/ui-kit/CHANGELOG.md).

> The tables below are translated from the ui-kit lane's original quick reference — same content, English wording.

## Feature → components map

| Feature to build | Use components |
|---|---|
| Login / Register / validated form | `useForm` + `zod` (schema) + `Field` + `Input` + `Button` — recipe 1 |
| CRUD page (table + search + edit) | `Table` + `Select` (filter) + `Pagination` + `Modal` (form) + `message` — recipe 2 |
| Filter bar | `Select` + `Input` (allowClear) + reset `Button` — recipe 3 |
| Multi-step wizard | `Steps` + `current` state + `Button` — recipe 4 |
| Upload with preview | `Upload` / `UploadDropzone` + `Progress` + `Image` — recipe 5 |
| Dashboard | `Card` + `Icon` + delta pill + `Chart` + `Timeline` + `EmptyState` — recipe 6 |
| Master-detail | `List`/`Avatar` + `Drawer` — recipe 7 |
| Notifications | `message.*` (compact toast) / `notification` (with title) / `Badge` on bell — recipe 8 |
| Settings page | `Tabs` + `Switch` + `Field`/`Input` — recipe 9 |
| Landing hero | `Button` + `Tag` + `Typography` + `Divider` + `Space` — recipe 10 |
| Vivid landing (drifting hero + blocks fading in + counting KPIs + collapsible panels) | `Parallax` + `Reveal` + `CountUp` inside `Statistic`/`Row`/`Col` — recipe 16 · combined with `Fade`/`Zoom`/`CollapseTransition` — recipe 17 |
| App navigation | `Sidebar` (collapsible) + multi-level `Menu` + `MenuCompactContext` auto icon-only |
| Horizontal menu | `Menubar` (hover dropdown) · `MegaMenu` (multi-column mega panel) · `TabMenu` (tabs nav) · `SplitButton` · `Dropdown` · `ContextMenu` |
| Sliding levels menu (panel/hamburger) | `SlideMenu` (translateX between levels, back + ESC) — recipe 18 |
| Date/time | `DatePicker` (range/showTime, locale vi/en) · `TimePicker` · `Calendar` |

> **Customize (from 0.7)**: EVERY component accepts `classNames` slots (antd v5-style, `root` + per-component sub-parts — e.g. `Input` has `input`/`prefix`/`suffix`, `Card` has `header`/`body`...) and `style` passthrough. The default path keeps the DOM untouched. See the `<Comp>ClassNames` types imported from the barrel.

## Layout & Nav — when to use

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Row`/`Col` | 24-col responsive grid — KPI rows, dashboard card mosaics, form column splits | `gutter` on `Row` (number or `[h, v]` px — antd mechanic: negative margin + col padding) | `Col span={24} md={12} xl={6}` mobile-first (xs→xl resolved via matchMedia) · wrap `Card`/`Statistic` dashboards · nest rows for sub-layouts |
| `Flex` | One-axis layout fast — toolbars, button rows, stacked forms (skip 24-col math) | `gap` (`'small' \| 'middle' \| 'large'` \| px, default 8) | `vertical` for stacked form fields · justify/align raw CSS values · lighter than `Row`/`Col` when columns don't matter |
| `Anchor` | In-page TOC with scroll-spy — docs, long settings, detail pages | `items` (`href: '#section-id'` + nested `children` for sub-levels) | `affix` sticky rail beside long content · `offsetTop` to clear sticky headers · `onClick` for analytics · `getContainer` for inner scroll areas |
| `Layout` | App frame — Header/Content/Footer/Sider zones (antd Layout parity) | `Layout.Sider` (`width`/`collapsed`/`collapsedWidth` — default 200↔80 matches Sidebar) | `Layout hasSider` + `Sidebar` inside Sider · `Header sticky` top bar · `useSiderCollapsed()` lets UI read collapsed state · `classNames` slots |

## Menu family — when to use

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `MegaMenu` | Top bar + MULTI-COLUMN dropdown panel (2 levels: group = column → leaf) — landing/app headers with many feature groups | `items[].children` (each group renders 1 column, grid follows the group count) | opens on hover OR click · closes on ESC/outside-click/leave (focus returns to trigger) · `role=menu` + `aria-expanded` · leaf `danger` red · `icon` from the Icon set |
| `SlideMenu` | Menu sliding BETWEEN LEVELS (narrow panel, mobile/hamburger, unlimited depth) | `items[].children` (recursive — translateX(-100%×depth), 0 deps) | back bar with chevron-left + parent level label · ESC pops a level · hidden page `inert` + `aria-hidden` · `ariaLabel` for the nav landmark |

Quick compare: `Menubar` = compact 1-level dropdown · `MegaMenu` = multi-column panel browsed by group · `SlideMenu` = deep levels in narrow space — recipe 18.

## Data Display — when to use

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Avatar` | Identity chip for a user/entity — letter initials by default, photo when `src` loads (fade-in; broken src falls back to initials) | `src` (falls back to initials children — on load fail too) | `AvatarGroup` (stacks) · `List` rows · `Card` extra · `classNames` slots |
| `AvatarGroup` | Stacked team/assignee faces with overflow | `max` — folds the rest into a "+N" pill whose tooltip lists hidden names | `Card` head extra · `Table` assignee cell · `Tooltip` built-in per avatar |
| `Badge` | Status pill (task/activity variants) OR antd-style count badge — corner count on children, standalone status dot | `variant` pill · `count`+`overflowCount` (99+) · `dot` · `status`+`text` · `offset` | `Table` status cells · bell `count` corner · filter status legend · `classNames` slots |
| `Card` | Grouped content panel with head/body/actions | `title` (pair with `hoverable` for clickable cards) · `loading` skeleton body · `size="small"` dense | `Card`+`Statistic` dashboard · `Card`+`Chart` · `Card`+`List` · `classNames` slots |
| `Carousel` | Sliding content — hero banner, media strip, onboarding steps | `itemsPerView` (1 = hero, 3-4 = card rail) | `Carousel`+`Image` gallery · built-in indicators/navigators/keyboard |
| `Chart` | Data viz: bar/line/pie/doughnut/radar | `config` (chart.js shape, per-dataset colors; per-dataset `type` for mixed) | `Card`+`Chart` dashboard · `fallback` node for missing peer-dep `chart.js` · heavy: subpath `@wakii/ui-kit/chart` (out of the barrel since 0.6.0) |
| `Collapse` | Progressive disclosure — FAQ, settings sections, logs | `items` (key/label/children, per-item `disabled`) · `accordion` (one open at a time) | inside `Card` body · default-open key via `defaultActiveKeys` |
| `Descriptions` | Label:value readout of an entity (task detail, meta panel) | `items` · `size="small"` + `colon` | `Drawer`/`Modal` detail pane · `Card` body · `bordered` for dense data · `classNames` slots |
| `Divider` | Separate/space content sections | `children` — text label embedded in the rule · `orientation="left|right"` | `Typography` sections · landing hero · settings groups |
| `Draggable` / `DropZone` | Native HTML5 drag & drop primitives — reorder lists, drop targets (0 deps) | `Draggable data` (JSON payload via dataTransfer, dedicated MIME) · `DropZone onDrop(data)` parses it back | `DragDropProvider` + keyboard: Space picks up (`aria-pressed`) → Arrows to zone → Enter drops / Esc cancels · `Draggable handle` limits the drag region · `disabled` locks a card · `DropZone activeClass` replaces the highlight · `accept` filters by `dataTransfer.types` · ⚠️ native DnD has no touch support — peer-dep dnd-kit if needed |
| `Editor` | Rich text (Tiptap v3) — notes, descriptions, inline HTML content | `content`+`onChange` (HTML string) · `placeholder` · `editorRef` imperative access | `fallback` node when peer-dep `@tiptap/*` missing · heavy: subpath `@wakii/ui-kit/editor` (out of the barrel since 0.6.0) |
| `Galleria` | Swipeable image gallery with dot indicators | `images` (per-image `caption` optional) | `Image` (click-to-zoom) for detail view · `Carousel` for non-image slides |
| `Image` (`UiImage`) | Image with click-to-zoom preview overlay | `alt` (also the preview dialog's aria-label) | `Galleria` grids · `Upload` preview · `Table` attachment cells |
| `ImageList` | Photo gallery grid — `standard` (fixed `rowHeight`, cropped) or `masonry` (CSS columns, natural heights) | `variant="masonry"` + `cols` (column-count; visual order runs top-to-bottom per column — MUI-identical caveat) | `items` + `caption` → figcaption · `onItemClick` → keyboard-activatable tiles (focus ring built in) · `renderItem` full tile control · `gap` = column-gap (vertical rhythm fixed `mb-2`) |
| `KanbanBoard` | Kanban board — `columns` controlled (consumer owns state), cards dragged across/within columns | `onCardMove(cardKey, fromColKey, toColKey, toIndex)` — toIndex is the FINAL position after the card left its source | `wipLimit` rejects drops on full columns + `border-st-fail` + aria-live · `tag`→Tag · `left` slot→Avatar · `renderCard` custom body · full keyboard (Tab → Space → ↑↓ position / ←→ column → Enter/Esc) · ⚠️ native DnD has no touch support |
| `List` | Repeating rows from data — feeds, task digests | `renderItem` (full row control) | `List`+`Avatar`+`Tag` rows · client-side `pagination` · built-in `loading` skeleton + `EmptyState` |
| `OrgChart` | Vertical org tree — company/team hierarchy, approval chains, reporting lines | `data` single root (`type` `'dept'\|'person'` switches background+icon) · `defaultCollapsedKeys` pre-collapses branches | `selectedKey`+`onSelect` highlights a node (accent border + aria-selected) · corner chevron collapses the subtree · pure-CSS connector line (0 measuring) · `role=tree/treeitem/group` |
| `Schedule` | Month calendar (FullCalendar dayGrid) for date-driven events — sprints, deadlines, bookings | `events` (+ `onEventClick`) | `fallback` node when peer-dep `@fullcalendar/*` missing · `Card` wrapper · heavy: subpath `@wakii/ui-kit/schedule` |
| `Segmented` | Compact single-choice switcher with no panels — view period, density, sort mode | `options` (`disabled` per-option) + controlled `value`/`onChange` | swap for `Tabs` when you don't need content panels · toolbar/filter-bar headers |
| `Skeleton` | Loading placeholder mirroring the real layout before data lands | `variant` (text/row/card/circle/button) + `count` | stack `circle`+`text`+`row` to compose a card · `Table loading` renders its own — prefer that for grids · `classNames` slots (`wrapper`/`bone`) |
| `Statistic` | Big-number KPI readout (title + value + prefix/suffix) | `value` (+ `prefix`/`suffix`) | `Card` dashboards · `valueStyle` to color by status · tabular-nums built in |
| `Steps` | Horizontal wizard progress header (done/current/waiting) | `current` (prop-driven, no internal state) | `Button` next/back beneath it (recipe 4) · `aria-current="step"` built in · `classNames` slots |
| `Table` | Data grid — sort/filter/paginate/select for CRUD backbones | `columns` (`sortable`/`filterable`/`render`/`align`) | recipe 2 CRUD · `virtual` for 5k+ rows · `selectionMode` for bulk actions · `globalFilter` · `expandable` master-detail rows (recipe 13) · `classNames` slots (`wrapper`/`header`/`row`/`cell`) |
| `Timesheet` | Weekly hours grid — rows = tasks/projects × 7 day columns (always Mon-start), cell = hours; row/column/grand totals built in for timesheet approval | `rows` (+ `editable` → `onCellChange(rowKey, dayIndex, value)`, clamp 0–24 step 0.5) | `Statistic` weekly total (recipe 15) · `week` + `onWeekChange` prev/next nav · `locale` vi/en · weekend columns shaded · `loading` skeleton |
| `Tabs` | Switch between content panels in place — settings, detail views | `items` (+ controlled `activeKey`/`onChange`) | settings pages (recipe 9) · `Segmented` when panels aren't needed · `classNames` slots (`wrapper`/`tablist`/`tab`/`panel`) |
| `Tag` | Tiny label chip — statuses, metadata; `Tag.Checkable` for filter chips | `closable`+`onClose` (consumer removes) · Checkable `checked`+`onChange` | `Table` status cells · `Checkable` chip groups in filter bars · `List` row meta |
| `Timeline` | Vertical activity feed — dot + text + time per entry | `items` (per-item `color` dot, `label` time) · `mode="alternate|left|right"` (label column) · `pending` hollow dot | `Card` body feeds · audit/history panels (recipe 6) · deploy logs with a "rolling out…" tail · `classNames` slots |
| `Tree` | Expand/collapse hierarchy — file trees, category nav | `data` (+ `defaultExpandedKeys`; uncontrolled expand state) · `showLine` connector borders | side navigation panels · use `TreeSelect` when a value must be picked |
| `TreeTable` | Hierarchical data as a grid — file trees with columns, WBS/org with metadata | `data` (recursive `{key, children?, values}`) + `columns` (`header`/`align`/`render`) | `defaultExpandedKeys`/`expandedKeys` + `onRowToggle` · `selectionMode` single/checkbox (+ select-all counts collapsed nodes) · indent `--sp-4` × depth · expand animates grid-rows 3-tier clip |
| `VirtualScroll` | Windowed list for 10k+ rows — mounts only the visible window + buffer, GPU translate | `itemSize` (FIXED row height px — dynamic height is a known backlog) | `height` px or `'100%'` (measured after mount) · `onScrollEnd` fires once per bottom-hit for load-more · pair with `List`-style rows · NOT for `Table` (use `Table virtual`) |


## Forms — when to use

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `AutoComplete` | Free-text input with type-to-filter suggestions (search-as-type) | `suggestions` — `onChange` gives raw text, `onSelect` gives the picked value | `Field` wrap · `Button` submit · empty `suggestions` → dropdown never opens |
| `Calendar` | Month grid for inline date browsing/picking (no trigger field) | `value` + `onChange` (controlled selected day) | `locale="vi"\|"en"` · `range` + `onDayHover` (drives DatePicker) · `bare` inside panels |
| `CascadeSelect` | Hierarchical pick (region → city → ward) through expanding panel columns | `options` (nested `children` define the levels) | `value` is a path array `["hn","bd"]` · keyboard ↑↓/Enter/Esc on the trigger |
| `Checkbox` | Single on/off decision with a visible label · tri-state parent (partially selected) | `checked` boolean\|`null` (null = indeterminate — dash + `aria-checked="mixed"`) · antd-style `indeterminate` override + `onChange(bool)` | `disabled` · inside `Field` · select-all header controls child lists (cycle true→null→false) · prefer `Switch` for instant-apply settings |
| `Chips` | Multi-value tag input — Enter adds, × removes, Backspace pops the last | `value: string[]` + `onChange` | `placeholder` hint · `disabled` hides input + remove buttons · duplicates ignored |
| `ColorPicker` | Color choice: swatch + preset grid + native picker + hex field | `presets` (curated palette; `[]` = native + hex only) | `value` hex · `onChange` fires from preset/native/hex alike |
| `DatePicker` | Date pick through a trigger + calendar panel | `range` + `showTime` (with `locale` vi/en) | `value: Date \| [Date, Date]` · `now` injectable for tests · `prefix` icon · footer "Today"/OK |
| `Inplace` | Click-to-edit inline value (read mode → edit form → close) | `display` + `children` (the edit form) | `Input`/`Textarea` inside · `onClose` after closing the form |
| `Input.Search` | Search box with an attached search button — filter bars, toolbars | `onSearch` (fires on Enter AND button click) | `enterButton` true→primary icon button, ReactNode→default button with content · `loading` swaps in Spinner + blocks extra submits · shares `size`/`invalid`/`disabled` with `Input` |
| `InputMask` | Constrained format typing — `9`=digit, `a`=letter, `*`=alnum, others literal | `mask` | `placeholder` showing the format · `ariaLabel` for the accessible name · typing past an invalid char just stops |
| `InputNumber` | Numeric input with vertical stepper + ↑↓ + min/max clamp | `min`/`max`/`step` | `invalid` red border · blur snaps the display to the clamp · `value` is read at mount (uncontrolled internal) |
| `InputOTP` | N single-char cells with auto-advance + multi-cell paste | `length` | `value`/`onChange` as one joined string · `ariaLabel` per cell ("code 1…") · digits only · Backspace walks back |
| `Mention` | Textarea with @-triggered mention list | `suggestions` (filtered by the text after @) | ↑↓ + Enter/Esc keyboard pick · `value`/`onChange` is the full text · picks insert `"@Name "` |
| `Password` | Password field with show/hide toggle (+ optional strength meter) | `showStrength` | `ariaLabel` · `value`/`onChange` · wraps `Input` |
| `PickList` | Two-column transfer (source ⇄ target) | `source`/`target` + `onChange(source, target)` | multi-pick then chevron move · each listbox keyboard-navigable (↑↓ + Enter/Space) · `aria-multiselectable` |
| `Radio`/`RadioGroup` | Single choice among a few always-visible options | `RadioGroup options` + `value` | per-option `disabled` · standalone `Radio` for one-offs · prefer `Select` when options are many |
| `Slider` | Numeric pick on a track — single value or a range | `range: [lo, hi]` + `onRangeChange` | `step` snapping · keyboard ←↓/→↑ (clamped) · `ariaLabel` required (`role="slider"`) |
| `Switch` | Instant on/off setting toggle | `checked` + `onChange` | `size="small"` for dense rows · inside `Field`/settings `Tabs` · `role="switch"` + `aria-checked` built-in |
| `TimePicker` | HH:mm pick via stepper panel (+ "Now" shortcut) | `value` — Date keeps its date-part on change, string `"HH:mm"` emits epoch-day | `locale` vi/en · `now` injectable for tests · pairs with `DatePicker` `showTime` |
| `ToggleButton` | Button with a pressed state (on/off action) | `checked` (exposed as `aria-pressed`) | `disabled` · clusters of toggles (filters/view switches) · unchecked = default variant look |
| `TreeSelect` | Pick a LEAF from a hierarchy, with search + clear | `treeData` (nested `children`; parents are headers, not pickable) | `searchable` filters by label/path · `clearable` × resets · trigger shows the `"A / B"` path |
| `Textarea` (autoSize) | Multi-line text that grows with content — notes, descriptions | `autoSize` (`true` = unbounded from 2 rows; `{minRows, maxRows}` clamps via JS scrollHeight measure — antd parity) | inside `Field` + `showCount`/`maxLength` · coexists with `invalid` · controlled AND uncontrolled both re-measure |

## General — P0/P1 parity additions (2026-10-18, worker W6)

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Link` | Inline anchor inside copy / standalone nav link — accent color on hover | `underline` (`'none'|'hover'|'always'`, default `'hover'`) | `disabled` drops href + `aria-disabled` + swallows click · `target`/`rel` passthrough for external links · standard focus ring |
| `Affix` | Sticky wrapper pinned to an edge while scrolling — floating toolbar/filter bar | `offsetTop` (default 0; `offsetBottom` → bottom mode) | `onChange(affixed)` fires only on CHANGE (not on mount) · pure CSS sticky, 0 deps · `target()` names the exact scroll container |
| `QRCode` | SVG QR for payment links / sharing / check-in | `value` (`size` default 160) | `errorLevel` L/M/Q/H (default M) · token colors `--ink` on `--c-s1` (dark cascades automatically) · `role="img"` + aria-label from value · vendored qrcode-generator MIT — no runtime deps |
| `ButtonGroup` | Attached row/column of Buttons sharing size/type — combined actions, pagination clusters | `size` + `type` (context cascades to child Buttons; explicit child prop wins) | joined chrome (`-ml-px` seam, outer corners keep rounded-lg) · `orientation="vertical"` · `role="group"` + `ariaLabel` REQUIRED (a11y rule 10) |
| `Portal` | Pure `createPortal` primitive for custom overlays — mount anywhere outside the React tree | `container` (element \| getter; `undefined` = body, `null` = inline; SSR-safe) | custom popovers/toasts outside clip/stack contexts · `Modal`/`Drawer` keep their internal portals (no retrofit) |

## Theming & Hooks — when to use

| Component / Hook | Use when | Most valuable prop / arg | Common combos |
|---|---|---|---|
| `UiKitProvider` | Scope a theme subtree — dark mode or runtime token overrides without re-render | `theme` — `'dark'`, an object `{ accent, accentHi, canvas, s1/s2/s3, ink/ink2/ink3, line, done/doing/fail, radiusLg/radiusXl/radiusPill, font }` (17 keys → CSS vars cascade) OR per-mode `{ light: {...}, dark: {...} }` — the provider follows the ancestor's `data-bp-theme` attribute | wrap app root or a panel · `accent`/`accentHover` shorthand · radius tokens: `rounded-lg/xl` across the kit reads `--r-lg/xl` (0.7+) |
| `useChartPalette` | Chart palette resolved from tokens + LIVE with theme (MutationObserver) — custom dataset colors still respect dark mode | no args — returns `{ accent, accentHi, ink, ink2, ink3, line, canvas, s1/s2/s3, stDone, stDoing, stFail }` | use for `Chart` config custom `backgroundColor`/`borderColor` (0.7.1+) |
| `useFieldArray` | Dynamic rows in `useForm` (antd Form.List parity) — invite lists, line items | `nameAt(i, key)` → name `list.<i>.<key>` keeps form auto-focus-first-invalid working | `fields`/`count` render · `append(row)`/`remove(i)`/`move(from,to)`/`swap(a,b)`/`update(i,patch)` · errors follow ROWS (rebuilt from a fresh snapshot per op) · recipe 17 |
| `useForm` | Form state + zod validation (RHF-style minimal API) | `schema` (zod = source of truth; `mode` = onSubmit/onBlur/onChange) | `Field`+`Input`+`Button` · errors land on `errors.field` + auto-focus first invalid |
| `useClickAway` | Close on outside interaction — dropdown, popover, menu | returned `ref` (attach to the inside element) | `Dropdown`/`Menu` builds · `useRef`-based popovers |
| `useFocusTrap` | Lock Tab focus inside a dialog, restore focus on close | `(ref, active)` — focus first focusable (or container), cycle Tab, restore to trigger | `Modal`/`Drawer` (built-in) · any custom `role="dialog"` |
| `useCopyToClipboard` | Copy-to-clipboard with feedback | returned `[copiedText, copy]` — `copy(text)` → boolean | `Button`+"Copied!" flash · `Input` copy-affordance |
| `useCountdown` | Ticking countdown — OTP resend, cooldown | `initialSeconds` (+ `intervalMs`) → `{ remaining, restart, … }` | `Button` disabled while counting · OTP/2FA UIs |
| `useDebounce` | Delayed value — search-as-you-type, expensive derivations | `delayMs` (default 500) | `Input` search → `Table`/`List` filter · API calls |
| `useThrottle` | Rate-limited value — scroll/resize handlers | `intervalMs` (default 500) | `useWindowSize` consumers · infinite-scroll triggers |
| `useTimeout` | Timeout as a component-safe effect | `delayMs` + `callback` (returns `{ start, clear, … }`) | toasts auto-dismiss · tooltip delays |
| `useToggle` | Boolean on/off state | `initialValue` (returns `[value, toggle]`) | `Collapse` custom triggers · sidebar collapsed · any show/hide |
| `useDefault` | State that falls back to a default when value is undefined | `defaultValue` | controlled/uncontrolled bridge · form field fallbacks |
| `usePrevious` | Value from the previous render | — (single arg) | transition/diff animations · change detection in effects |
| `useHover` | Hover state without CSS (JS-driven visuals) | returned `ref` | drag handles · canvas-like interactions CSS can't express |
| `useKeyPress` | Reactive "is key pressed" + optional callback | `targetKey` (`'Escape'`, `'Enter'`…) + `onPress` | dialog ESC handlers (prefer built-in) · shortcut hints |
| `useLockBodyScroll` | Prevent background scroll while open | `locked` (default true) | `Modal`/`Drawer` (built-in) · fullscreen previews |
| `useMediaQuery` | Reactive matchMedia boolean | `query` (e.g. `'(min-width: 768px)'`) | responsive JS behavior · `prefers-reduced-motion` branches |
| `useWindowSize` | Live viewport width/height | — (no args) | virtualized lists · breakpoint-adjacent JS logic |
| `useLocalStorage` / `useSessionStorage` | Persistent (tab) / session state without effect boilerplate | `key` + `initialValue` | theme preference · drafts · wizard step memory |

## Theming & Motion — when to use

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Parallax` | Scroll-linked drift — landing hero images/banners drift slower than the page, adding depth | `speed` (0–1; 0.3 common; `scale` zooms slightly with drift) | wrap landing hero/section images (recipe 16) · **a11y safe: disables itself under `prefers-reduced-motion`** (via `useMediaQuery`) or `disabled` · 0 deps — styles write straight to the node, 0 re-renders/frame |
| `Reveal` | Block fades in as it enters the viewport — landing sections, card lists, KPI rows | `direction` (`up` default — uses the built-in `bp-slide-up-in` keyframe; `down/left/right` = fade + transform transition) | `delay` (stagger 0/150/300ms — fill backwards keeps it hidden while waiting) · `once` defaults true (IO disconnects after the first entry), `once={false}` replays on every entry · shows immediately when the environment lacks IntersectionObserver · reduced-motion auto-disable via the global block |
| `CountUp` | Ease-out number counting for KPIs/metrics — dashboards, landing stats | `value` (+ `duration` seconds, default 1.2; `0` = land instantly) | `decimals`/`format` (locale vi-VN, unit) · `onDone` fires exactly once · `Statistic value={<CountUp …/>}` dashboards (recipe 16) · changing `value` animates from the displayed number (no jump to 0) · `tabular-nums` built in |
| `Fade` / `Zoom` | MUI-style enter/exit wrappers for small cards/popovers — animated show/hide instead of hard unmount | `in` (exit runs to COMPLETION before unmount — Modal-style state machine) | `unmountOnExit={false}` keeps the DOM, holds `opacity-0` · `duration` ms override via inline style (classes keep literals for Tailwind) · keyframes `bp-fade/zoom-in/out` built in · reduced-motion auto-disable via the global block |
| `CollapseTransition` | Height collapse/expand for FAQ/details panels under a trigger — dynamic height without DOM measuring | `in` | grid-rows `0fr↔1fr` (0 keyframe height) · **padding belongs INSIDE children — the `overflow-hidden` layer must clip cleanly** · barrel renamed to avoid clashing with `Collapse` (precedent `UiImage`) · reduced-motion auto-disable via the global block |
| `Backdrop` | Full-screen scrim behind modal/composer/loading — click outside to close | `open` + `onClick` (controlled — consumer owns state) | token background `--scrim-4` + `z-[var(--z-modal)]` (no `bg-black/85`) · children slot for a centered Spinner · no self-portal — place inside the consumer's portal (Modal/Drawer pattern) |

## Feedback & Overlay — when to use

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Alert` | Inline status banner that stays in the page flow (not transient) | `type` (`success`/`info`/`warning`/`error`) + `variant` (`filled` default; `outlined` for tinted look) | `description` detail line · `closable`+`onClose` dismissible · `classNames` slots (antd v5) |
| `BlockUI` | Lock a region in place while it is busy | `blocked` + `message` (label centered on the scrim) | wrap `Table`/`Card` during fetch · pair with `Spinner` outside the lock |
| `ContextMenu` | Right-click menu on a region — positioned at the pointer | `items` (key `'---'` = divider; `danger`/`disabled` per item) | `onItemClick` switch by key · arrow-key nav + ESC + outside-click built-in |
| `Drawer` | Side panel for detail/form without leaving context (portal, focus trap, scroll lock) | `open` + `onClose` (ESC, mask click, × wired) | `width` (default 378 antd) · `footer` action row · `Descriptions` as body · `classNames` slots |
| `Dropdown` | Button-triggered action menu | `items` + `onItemClick` | `trigger` = `Button` · `'---'` divider · `danger`/`disabled` per item · ArrowUp/Down/Home/End + `role=menu/menuitem` built-in · `classNames` slots |
| `Message` | Transient global toast — static API, 3s auto-dismiss | `message.success\|info\|warning\|error(content)` | call anywhere (no React state) · `classNames` slots |
| `Modal` | Blocking confirm/dialog on top of the page (portal, focus trap, scroll lock) | `open` + `onOk`/`onCancel` (ESC + mask + × all cancel) | `danger` red OK · `confirmLoading` locks both buttons · `okText`/`cancelText` · `classNames` slots |
| `Notification` | Rich toast with title + description — static API, 4.5s | `notification.success(title, description?)` | manual × close built-in · `classNames` slots |
| `Popconfirm` | Confirm bubble anchored to a trigger (delete guard) | `open` (controlled) + `onConfirm`/`onCancel` | `danger` red icon/OK · `title` + `description` · ESC = cancel · `okText`/`cancelText` |
| `Popover` | Rich anchored panel — free `content` ReactNode (lists, links, mini actions), unlike Tooltip's text-only hint | `content` (any ReactNode; pair with `title` for the divider head) | `trigger` `hover\|click\|focus` (default hover) · controlled `open`/`onOpenChange` · `placement` top/bottom · ESC + click-outside close built in · `classNames` slots |
| `Progress` | Progress readout — line bar or circle, both with % info | `percent` (+ `type="circle"` SVG dash arc with `size` px) | `status="exception\|success"` recolors bar/arc · `showInfo={false}` hides % · `indeterminate` = infinite run (line) / spin arc (circle, motion-reduce safe) |
| `Result` | Full-area status page (success/error/404/500/warning/info) | `status` (drives icon, color, default title) | `title`/`subTitle` override · `extra` action buttons |
| `Spinner` | Inline busy indicator (ring/dots/bars) | `label` (REQUIRED aria-label) | `size` (`sm`/`md`/`lg`) + `color` (`inverse` on dark surfaces) · pair with `BlockUI` scrim |
| `Tooltip` | Hover/focus hint bubble (top/bottom) — portal-free, wraps the trigger in place | `title` (bubble content) · `placement` `top`/`bottom` | wrap any focusable trigger · `aria-describedby` auto-wired · ESC dismisses · `classNames` slots |
| `Watermark` | Content guard overlay — repeated diagonal text tile over previews/documents/drafts | `content` (string or `string[]` for multi-line) | wraps any block (children stay interactive — overlay `pointer-events-none`) · `rotate`/`opacity`/`font`/`fontColor` custom tile · corner-anchored via `left`/`top`/`width`/`height` · dark theme re-bakes the tile automatically |

## MANDATORY rules (violation = review fail)

1. **Tokens-only** — no hex/arbitrary colors in className: use `bg-s1/s2/s3`, `text-ink/ink2/ink3/ink4`, `border-line/line2`, `text-accent`, `text-st-fail/done/doing`, `bg-canvas`. Need a variant → token opacity (`bg-accent/10`), never invent.
2. **Dark theme** — `data-bp-theme="dark"` on `<html>` or a wrapping node; the host imports `styles/themes/dark.css` once. Components NEVER code dark separately (CSS vars cascade).
3. **Z-index** — only `z-[var(--z-dropdown|popover|modal|toast|tooltip)]` (1000<1030<1050<1070<1090). `z-30`/hardcoded numbers forbidden.
4. **Focus** — `focus-visible:ring-2 focus-visible:ring-accent/40` (NO ring-offset — the approved standard, no more "double border"). Off-standard `focus-visible:outline-2 outline-accent` forbidden.
5. **Sizes** — control heights `h-8` (small) / `h-9` (middle default) / `h-10` (large).
6. **Motion** — 150–200ms + easing tokens (`--ease-enter/exit`); reuse keyframes `bp-fade-in`, `bp-zoom-in`, `bp-slide-up-in`, `bp-switch-pop` (e.g. `animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]`). `prefers-reduced-motion` auto-disables via the global block.
7. **Radius** — controls `rounded-lg` · cards/modal/panels `rounded-xl` · switch/tag/handle `rounded-pill`.
8. **Shadow** — only `var(--shadow-pop|lift)`; custom micro-shadows need a documented reason.
9. **Icon** — always `<Icon name="…" size={n} />` from the primeicons set (48 names — see `src/ui/icons`). Hand-drawn SVG chevrons/glyphs forbidden.
10. **Minimum a11y** — icon-only buttons need `aria-label`; menus: `role=menu/menuitem` + `aria-expanded`; selected: `aria-current`; switches: `role="switch"` + `aria-checked`; decorative icon badges: `aria-hidden`.

## Anti-patterns (have happened — do not repeat)

- ❌ Hand-drawing `<svg>` chevrons/glyphs instead of `<Icon>` (off-set, duplicate paths)
- ❌ `rounded-2`/`rounded-3` (legacy — the standard is `rounded-lg` control / `rounded-xl` card)
- ❌ Hardcoded `rgba(0,0,0,…)` outside shadows (breaks dark) — use `bg-black/85` or `ink/*` tokens
- ❌ Conditional className string surgery (utilities easily contradict) — write each variant explicitly
- ❌ `!important`/`!bg-…` except to override third-party CSS
- ❌ State-driven re-render churn for reference-compared libraries (e.g. swiper/react) — use imperative ref + classList
- ❌ Story file with 0 `export const` (indexer drops it — every file needs ≥1 story)
- ❌ Story meta with `component:` when stories only have `render: () => …` and the component has required props — StoryObj infers `args` MANDATORILY → TS2322 blocks push. Fix: no `component` on meta (`satisfies Meta` without generic — the `image.stories` pattern); only attach `component:` when every story passes full `args` (the `galleria.stories` pattern)

## Operations notes

- ui-kit is **consumed from source** (`main/types → src/`): edits show instantly, NO build step.
- Consumers install peer-deps themselves: `zod` (useForm) · `swiper` (carousel subpath) · `chart.js` · `@tiptap/*` · `@fullcalendar/*` (optional).
- Heavy components import via **subpath**: `@wakii/ui-kit/carousel|chart|schedule|editor` — NOT in the main barrel (`Carousel` since 0.5.0; `Chart`/`Schedule`/`Editor` since 0.6.0 — corresponding types remain type-only exports from the barrel).
- Zod schema = validation source of truth; `mode: 'onSubmit' | 'onBlur' | 'onChange'`; on failure → `errors.field` + auto-focus the first `[name=…]`.
