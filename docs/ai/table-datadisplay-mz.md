# Data Display m–z — when to use

> Group G slice (components `m`→`z`). Merged into `AGENTS.md` "Data Display" section by the coordinator.
> APIs verified against source during the full-case-matrix audit (stories 56→59, tests 95→110 in this group).

| Component | Use when | Power props / combo |
|---|---|---|
| `Schedule` | Month calendar (FullCalendar dayGrid) for date-driven events — sprints, deadlines, bookings | `events` + `onEventClick` · `fallback` node for missing peer-dep `@fullcalendar/*` · heavy: subpath `@wakii/ui-kit/schedule` · wrap in `Card` |
| `Segmented` | Compact single-choice switcher with no panels — view period, density, sort mode | `options` + controlled `value`/`onChange` · swap for `Tabs` when you don't need content panels · toolbar/filter-bar headers |
| `Skeleton` | Loading placeholder mirroring the real layout before data lands | `variant` (text/row/card/circle/button) + `count` · stack `circle`+`text`+`row` to compose a card · prefer `Table loading` for grids · `classNames` slots (`wrapper`/`bone`) |
| `Statistic` | Big-number KPI readout — title + value + prefix/suffix | `value` + `prefix`/`suffix` · `valueStyle` to color by status · tabular-nums built in · `Card` dashboards |
| `Steps` | Horizontal wizard progress header (done/current/waiting) | `current` (prop-driven, no internal state) · `aria-current="step"` built in · `Button` next/back beneath it (recipe 4) |
| `Table` | Data grid — sort/filter/paginate/select for CRUD backbones | `columns` (`sortable`/`filterable`/`render`/`align`) · recipe 2 CRUD · `virtual` for 5k+ rows · `selectionMode` bulk actions · `globalFilter` · `classNames` slots (`wrapper`/`header`/`row`/`cell`) |
| `Tabs` | Switch between content panels in place — settings, detail views | `items` + controlled `activeKey`/`onChange` · settings pages (recipe 9) · swap for `Segmented` when panels aren't needed · `classNames` slots (`wrapper`/`tablist`/`tab`/`panel`) |
| `Tag` | Tiny label chip — statuses, metadata; `Tag.Checkable` for filter chips | `closable`+`onClose` (consumer removes) · Checkable: `checked`+`onChange` · `Table` status cells · `Checkable` chip groups in filter bars |
| `Timeline` | Vertical activity feed — dot + text + time per entry | `items` (per-item `color` dot, `label` time) · `Card` body feeds · audit/history panels (recipe 6) |
| `Tree` | Expand/collapse hierarchy — file trees, category nav | `data` + `defaultExpandedKeys` · uncontrolled expand state · side navigation panels · use `TreeSelect` when a value must be picked |
| `TreeSelect` | Pick one leaf from a hierarchy — searchable `Parent / Child` path | `treeData` + `searchable` (label or path match) · `clearable` in filter bars · leaf-only selection · `ariaLabel` required — wrap in `Field` |

> Note: `Pagination` also falls in the m–z range but is **not** part of group G's slice — needs an owner before merging.
