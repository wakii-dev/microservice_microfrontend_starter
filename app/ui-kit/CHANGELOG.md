# Changelog — @wakii/ui-kit

Format theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); đánh số hướng SemVer.
ui-kit **consumed qua source** (ADR-0009) nên "release" = điểm merge PR vào `main`;
mục `[Unreleased]` gom các batch giữa 2 lần merge.

## [2.0.0] — 2026-10-29 (STABLE — "wakii 1.0" milestone) — 2026-10-29

### Changed (auto — 4d12760..08a0806 qua CI workflow publish-packages)

- (không có commit chạm app/ui-kit/ trong range 4d12760..08a0806 — bump only)
## [1.0.0] — 2026-10-29 (STABLE — wakii ecosystem 1.0)

First stable release. 117 components (antd × PrimeReact × MUI parity), classNames slots + style passthrough toàn thư viện, UiKitProvider dark/light + accent, subpath exports cho 5 engine nặng, 1.565 tests, coverage gate 88%, animated SVG docs via unpkg CDN. Ecosystem: create-wakii-app 1.0.0 + create-wakii-stack 1.0.0 ship cùng ngày.

## [0.8.3] — 2026-10-29

### Changed (auto — f73af29..f73af29 qua CI workflow publish-packages)

- (không có commit chạm app/ui-kit/ trong range f73af29..f73af29 — bump only)
## [0.8.2] — 2026-10-29

### Changed (auto — 4c1486e..4c1486e qua CI workflow publish-packages)

- (không có commit chạm app/ui-kit/ trong range 4c1486e..4c1486e — bump only)
## [0.8.1] — 2026-10-29

### Changed (auto — 8f34bf5..b05b78e qua CI workflow publish-packages)

- (không có commit chạm app/ui-kit/ trong range 8f34bf5..b05b78e — bump only)
## [0.8.0] — 2026-10-29 (MUI parity — Textarea autoSize, ButtonGroup, ImageList, Portal, Progress circle)

### Added

- `Textarea autoSize` — antd-parity auto-grow: `true` = unbounded from 2 rows; `{minRows, maxRows}` clamps via JS scrollHeight measure. Controlled and uncontrolled both re-measure; default path (no autoSize) byte-identical.
- `ButtonGroup` — attached row/column of Buttons: joined chrome (`-ml-px` seam, outer corners keep `rounded-lg`), `orientation`, size/type cascade via context (explicit child prop wins), `role="group"` + required `ariaLabel`.
- `ImageList` — gallery grid: `standard` (fixed `rowHeight`, cropped) / `masonry` (CSS columns, MUI-identical mechanics, visual order top-to-bottom per column); `onItemClick` → keyboard-activatable tiles with focus ring; `renderItem` override.
- `Portal` — standalone `createPortal` primitive: `container` element or getter; `undefined` = `document.body`, `null` = inline render; SSR-safe.
- `Progress type="circle"` — SVG dash arc (`size` px, default 40), status strokes via CSS vars, `indeterminate` = spinning arc (`motion-reduce` honored), centered `%` with `showInfo`.

## [0.7.0] – [0.7.2] — 2026-10-26 → 2026-10-28 (backfill: slots-DOM 113/113, dark polish, useChartPalette, npm 0.7.2 — see git log #121–#158)

## [0.6.0] — 2026-10-25 (customize pass — classNames slots + style passthrough toàn thư viện)

### Added

- **Customize pass (SÓNG-3, waves 1-3)**: `classNames` slots (antd v5-style) + `style` passthrough cho ~30 components — Button (root/icon), Input (root/input/prefix/suffix), Textarea, Select, Checkbox, Radio, Switch, Card, Tag (+Checkable), Spinner, Alert, v.v. Default path (không truyền) giữ nguyên DOM/GUI hoàn toàn — consumer append qua slots, `className` user luôn cuối.
- Barrel export đầy đủ `*ClassNames` types (ButtonClassNames, InputClassNames, TagClassNames, SpinnerClassNames, …).
- Dep `classnames` cho merge gọn slots.

### Fixed

- Spinner story CustomStyled bỏ annotation StoryObj (TS2322 sót wave 2).
- ButtonClassNames sót barrel trong PR #93.

## [0.6.1] – [0.6.2] — 2026-10-25 (bản intermediate do release song song — xem git log)

## [0.6.3] / [0.6.4] — 2026-10-25 (BREAKING — lazy-load npm chạy thật: Chart/Schedule/Editor rời barrel)

### Breaking

- **`Chart` / `Schedule` / `Editor` rời barrel chính** → import qua subpath `@wakii/ui-kit/chart` · `@wakii/ui-kit/schedule` · `@wakii/ui-kit/editor` (theo Carousel 0.5.0). `useChartTheme` đi theo `Chart` qua subpath. Types vẫn export từ barrel. Consumer monorepo duy nhất dùng barrel (admin `Dashboard.tsx`) đã đổi subpath.

### Fixed

- **BUG #4 — npm consumers (Vite dev + prod) thấy Chart/Schedule/Editor rơi fallback vĩnh viễn**: dist dynamic import peer qua BIẾN specifier → bundler không phân tích tĩnh được → bundle prod giữ `import("chart.js/auto")` bare → fallback câm lặng kể cả khi peer đã cài. Fix: specifier LITERAL — vite dev + rollup đều resolve khi peer installed; peer thiếu → build error rõ ràng. Verify e2e consumer ngoài monorepo: prod code-split + dev canvas painted thật.

### Added

- `peerDependencies` đủ 3 peer lazy-import: `@fullcalendar/daygrid` + `@fullcalendar/interaction` `^6.1.15`, `@tiptap/starter-kit` `^3.32.0` (meta optional).

## [0.5.0] — 2026-10-24 (BREAKING — barrel chính sạch彻底 peer imports)

### Breaking

- **`Carousel` rời barrel chính** → `import { Carousel } from '@wakii/ui-kit/carousel'`. Component phụ thuộc `swiper/react` (peer) — nằm trong barrel phá nguyên tắc 0-deps: consumer KHÔNG cài swiper fail vite build (`"Swiper" is not exported` — bắt từ gate create-wakii-app end-to-end). Không consumer nào trong monorepo import từ barrel (đã grep).

### Fixed (chuỗi hotfix 0.4.1→0.5.0 — tất cả bắt từ gate scaffold thật + install + vite build)

- 0.4.1: npm exports trỏ TS source → consumer vite không resolve package entry; publish script rewrite exports sang dist (6 entry)
- 0.4.2/0.4.3: dynamic peer imports (chart.js/auto, @fullcalendar/*) qua biến specifier — rollup consumer không phân tích
- 0.4.4: EditorInner entry riêng + tsup splitting:false — @tiptap/starter-kit không lọt index bundle qua shared chunk
- 0.5.0: Carousel dời subpath — swiper/react không lọt barrel (này)

## [0.4.4] — 2026-10-24 (hotfix 4 — index bundle sạch peer static imports)

### Fixed

- **`@tiptap/starter-kit` static import lọt vào index bundle qua shared chunk** — consumer không cài tiptap vẫn fail build dù không dùng Editor. tsup `splitting: false` (mỗi entry self-contained) + **EditorInner thành entry riêng** (`dist/editorInner.js`) — wrapper `React.lazy` import qua biến specifier (esbuild inline dynamic import khi không splitting; type giữ qua `import type`). Sau fix: `grep tiptap dist/index.js` chỉ còn fallback message string. Chuỗi hotfix 0.4.1→0.4.4 đều bắt từ gate end-to-end create-wakii-app (scaffold thật + install + vite build).

## [0.4.3] — 2026-10-24 (hotfix 3 — dynamic peer import qua biến specifier)

### Fixed

- `/* @vite-ignore */` bị esbuild strip khỏi dist (comment) — consumer build vẫn fail. Dynamic peer imports (chart.js/auto, @fullcalendar/*) chuyển sang **biến specifier** (`const FC_CORE = '@fullcalendar/core'; import(FC_CORE)`) — rollup/vite của consumer không thể phân tích tĩnh, giữ nguyên runtime import + fallback khi peer thiếu.

## [0.4.2] — 2026-10-24 (hotfix 2 — consumer vite build với dynamic peer imports)

### Fixed

- **Consumer Vite production build fail: `Rollup failed to resolve import "@fullcalendar/daygrid"`** — rollup phân tích cả dynamic import peer trong dist chunk dù consumer không cài peer đó. Dynamic imports peer (chart `chart.js/auto`, schedule `@fullcalendar/*`) thêm `/* @vite-ignore */` — bundler bỏ phân tích, runtime import bình thường (fallback sẵn khi peer thiếu). Bắt khi gate create-wakii-app: scaffold thật + install + `vite build` end-to-end.

## [0.4.1] — 2026-10-24 (hotfix publish — exports dist cho npm consumers)

### Fixed

- **npm exports trỏ TS source → consumers ngoài monorepo không build được** — repo exports `./src/index.ts` (ADR-0009 đúng cho monorepo) nhưng Vite/webpack consumers qua npm KHÔNG resolve được package entry `.ts` (`Failed to resolve entry for package` — bắt được khi gate create-wakii-app scaffold thật install + build). Publish script giờ rewrite exports sang **dist** (6 entry js/cjs/d.ts kể cả experience3d — tsup thêm entry) + main/module/types; styles giữ src (css thuần, có trong tarball). Repo không đổi (monorepo vẫn consumed-qua-source).

## [0.4.0] — 2026-10-24 (depth & motion wave — dark toàn diện + hooks mở trọn barrel)

> 23 commits (PR #55–#67 squash + trực tiếp): depth/elevation tokens, cinematic experience template, 12 hooks + 3 utils mở trọn barrel, Storybook manager 2 palette, landing ×2 motion showcase, sweep glyph→Icon SVG, app FE dark+motion pass, chart probe dark-live, Introduction redesign. Suite tại HEAD: **163 files / 1290 tests PASS** · **683 story exports / 142 file stories** (đếm tĩnh).

### Added

- **Depth & elevation tokens (coordinator)** — elevation 3 tầng `--ele-1..3` (shadow + inset highlight viền trên — component dùng theo trạng thái rest/hover/active, overlay giữ `--shadow-pop`) · surface wash `--wash` (kết hợp utilities `bg-s1/s2`) · depth contract `--ease-smooth`/`--motion-smooth` cho state-change. (`95ab014`, `55017c6`)
- **Experience cinematic template (workers V2, D)** — nhóm mới `templates/experience/`: `ChapterShell` lib + hero/chapters "chaptershell" (glass-nav contract sf3, design contract typography/palette/mood engine sf1) — chapter-shell test 77 assertions, sf3 **44 tests**. (`3ac8044`, `46f6807`)
- **Hooks wave ×12 + 3 utils + ScrollPage — MỞ TRỌN BARREL (PR #65)** — lifecycle/observers/controllable: `useMountEffect` · `useUpdateEffect` · `useIsFirstRender` · `useControllableState` · `useEventListener` · `useScrollProgress` · `useInView` · `useInfiniteScroll` · `useMeasure` · `useOnlineStatus` · `useFullscreen` · `useTitle` + utils `format` (`formatCurrency`/`formatBytes`/`formatRelativeTime`/`formatNumber`), `array` (`chunk`/`groupBy`/`flattenTree`/`findTreeNode`), `dom` (`getScrollParent`/`getFocusableElements`/`cx`) + `ScrollPage` section-snap; gỡ nợ barrel treo từ `267a273` — hooks suite **110 tests / 30 files**. (`1476eaf`)
- **Team-OS domain (worker V1)** — `PingFeed` (+`relTime`) · `StagePipeline` · `DebtBoard` · `TeamDashboard` · `InboxThread` — 29 tests. (`e22db92`)
- **Motion depth cluster (worker W8)** — transition family mở rộng 11 types, barrel dedupe (`Collapse`→`CollapseTransition` precedent) — 102 tests. (`2032bc1`)
- **Depth pass forms + data display (workers W6, D)** — 19 form + 7 data component polish theo depth contract (`ease-smooth`, elevation tier) — suite 1244 tại thời điểm đợt. (`f666fbe`)
- **Storybook manager chrome 2 palette (PR #57, #60)** — manager UI đồng bộ ngôn ngữ ui-kit (light antd / dark direction-B, brand + head html), trang showcase `Intro/Showcase` "Why Wakii UI Kit" (hero Reveal + stats CountUp + live demo + why-grid + footer CTA). (`ab2ac81`, `04cf002`)
- **Landing + Parallax Landing motion showcase (PR #62, #63)** — `landing.stories` motion hero + dọn prose dark contrast; `parallax-landing` depth-trio hero + parallax lab. (`dcdc4f8`, `3254185`)
- **Hooks demo stories ×9 (PR #67)** — `hooks-new.stories` (Theming & Motion/Hooks/New Wave): demo tương tác thật cho cả 12 hook mới (log timeline, controlled/uncontrolled toggle, scroll/in-view/infinite labs, online stub tự khôi phục, fullscreen + title). (`e4d2229`)
- **Chart probe dark-live (PR #66)** — pattern `useChartColors` (span ẩn + `getComputedStyle` đọc token trong theme scope, fallback hex như dashboard template) + `MutationObserver` trên `<html data-bp-theme>` → chart re-resolve màu NGAY khi dark toggle, không F5; áp `admin` Dashboard. (`f6469cd`)
- **Input.Search attached-button + InputNumber antd-fidelity redo (worker W6)**. (`c456866`)

### Fixed

- **Chart 2-shape bug (PR #67)** — `<Chart>` ép rebuild config theo shape flat (`config.labels`) trong khi consumer (admin Dashboard) truyền shape native chart.js v4 (`data:{labels,datasets}` lồng) → chart RỖNG im lặng (canvas 0 pixel, 0 lỗi console — chỉ bắt được bằng browser verify thật). Fix: component resolve cả 2 shape (`labels ?? data.labels`), type thêm nested optional + test nested mới; admin Dashboard chuẩn hoá về flat theo type. (`e4d2229`)
- **Dark docs text chìm (PR #61, #62)** — heading h1-h4 + inline code + note `ink2` trong docs/preview; dọn hết prose contrast sót (`preview-head` + `intro.docs`). (`a5f3414`, `dcdc4f8`)
- **Dark tokens polish (PR #60)** — `--ink4` `#5c626b` (mirror antd dark colorTextQuaternary, cùng họ `--ink3` `#8a8f98`) · `--bg-disabled` 4% đồng tỉ lệ light · alert tints dark chuyển alpha tint màu trạng thái (bg 12% / border 37%, error base = `--st-fail` dark `#f06a6a` — đồng bộ 100% 4 type) · shadow dark đậm ×1.6 · `color-scheme: light` default + `color-scheme: dark` scoped `[data-bp-theme="dark"]` (native controls ăn theo theme). (`04cf002`)
- **Sweep glyph ký tự → Icon SVG (PR #59, #60)** — đợt 1: 9 components (alert/drawer/input/input-search/table…); đợt 2: steps tick ✓, select marker ✓, upload-core/dropzone 4 SVG tự vẽ → Icon file/check/times/upload + **icon set 50→52** (`filter-fill`/`filter-slash`) + rounded chuẩn controls + focus-visible sót. (`ec7e1dc`, `04cf002`)
- **Table first-column sticky + Calendar responsive 375 (worker W6, PR #55)**. (`85cc797`)
- **Repo debts (PR #56)** — barrel `index.ts` export module chưa commit treo typecheck/test/build-storybook (gỡ export, mở khoá bằng `262e512`) · theme tokens dark · xoá `go-svc/ci.compose.override.yml` redundant · docs drift (CI disabled note, ADR-0009 index, ink3 templates, known-issue standalone). (`267a273`)

### Changed

- **Templates ink3→ink2 (PR #64)** — dark audit M#3: body mô tả chính (auth subtitle ×4, crud/settings emptyMessage, settings danger-zone caption) `text-ink3` → `text-ink2`; meta phụ giữ ink3. (`1ab7585`)
- **App FE dark + motion pass (PR #66)** — shell · tasks · activity · admin: nội dung chính ink2, nav link rest + CTA "Đăng nhập" nâng contrast (hover→ink), page subtitles admin ink2; chart admin probe dark-live. (`f6469cd`)
- **Introduction docs redesign ×2 vòng (PR #58, #67)** — #58 hero + stats + card layout; #67 đem ngang tầm showcase: wash hero + Reveal stagger, kicker accent + `Title level={2}` thay markdown trần, card hover-lift, demo bọc `Card`, CTA cuối dẫn Showcase. (`5490c8c`, `e4d2229`)

## [0.3.0] — 2026-10-19 (story VU-53 UI redesign — OCD parity wave)

> ~110 commits: 30+ component mới (Timesheet/Kanban/3D/Parallax-họ/Layout/TreeTable...), 6+1 templates, motion-max, a11y pass, app-fit 4 apps Wakii, storybook 131 titles/641 stories, eslint 0/0, 1111+ tests. Chi tiết mục dưới.

### Added

- **Motion system (worker W8)** — 2 đợt chuyển động 0-deps, chỉ animate `transform`/`opacity`: `Transition` family — `Fade`/`Zoom`/`CollapseTransition` (grid-rows 0fr↔1fr, 3 tầng grid > min-h-0 > children — không padding-leak) + `Backdrop` scrim `--scrim-4`; `unmountOnExit` mặc định, state machine kiểu Modal (exit chạy xong mới unmount, guard `e.target`), barrel đổi `Collapse`→`CollapseTransition` · `Parallax` (scroll-linked translateY + rAF-throttle, tự tắt reduced-motion) · `Reveal` (IntersectionObserver, `direction`/`delay`/`once`) · `CountUp` (rAF ease-out, `decimals`/`format`, animate tiếp từ số đang hiển thị) — **36 tests (13 + 23) + 20 stories (7 + 13)**. (`157cfc2`, `47e1f55`)
- **Navigation & data display (workers V2, W9, D, W7)** — `OrgChart` cây tổ chức connector thuần CSS (dept/person node, collapse, `role=tree/treeitem`) · `MegaMenu` bar + panel dropdown multi-column (group = cột, hover/click, ESC trả focus trigger) · `SlideMenu` trượt ngang giữa các cấp (`translateX`, back bar, trang ẩn `inert`) · `Layout` composite antd (Header/Content/Footer/Sider + `useSiderCollapsed`) · `TreeTable` cây dạng bảng (`role="treegrid"`, expander + indent, selection, expand animate grid-rows) · DragDrop primitives + `KanbanBoard` polish edge-cases (native HTML5 DnD — không touch, peer-dep dnd-kit nếu cần) — **66 tests (8 + 14 + 19 + 25) + 29 stories**. (`7e3d0ec`, `b73d2e6`, `1782a5d`, `a8e6fd1`)
- **Mobile batch (worker V1)** — 4 component layout hẹp: `BottomNavigation` (fixed-bottom MUI-style, `hideOnScroll`) · `FloatButton` + `Group` (nút nổi + BackTop tích hợp) · `Fieldset` (legend lợn viền, toggleable) · `DeferredContent` (IntersectionObserver render-lazy) — **26 tests + 16 stories**. (`70f1f36`)
- **Forms & field arrays (workers W6, V2)** — `useFieldArray` companion `useForm` (antd Form.List parity): `fields`/`count`, `append`/`remove`/`move` (insert-at)/`swap`/`update`, `nameAt` giữ focus-first-invalid, errors rebuilt từ snapshot — lỗi đi theo ROW · `Checkbox` tri-state (`null` = indeterminate, `aria-checked="mixed"`) · `InputNumber` stepper flush container (chỉ góc ngoài bo, `active:opacity` thay scale) — **16 tests mới (12 + 4) + 3 stories + demo**. (`8c5f716`, `e94b3e4`, `4b85830`)
- **antd/MUI parity + Table advanced (worker W6)** — Gap P0: `Input.Search` composite · `Link` (underline modes, disabled bỏ href) · `Affix` (sticky thuần, onChange đo trên scroll container thật) · `Table` `expandable` · Gap P1: `QRCode` SVG (vendored qrcode-generator v1.4.4 MIT, UTF-8, không deps runtime) + `icon` excavate mode R10 (khung nền punch-out giữa đồng bộ bgColor — matrix giữ nguyên, scanner bù qua EC; có icon không truyền level tự nâng H) · Table advanced: `scroll={{ y }}` fixed header + filter row sticky, `summary` tfoot dính đáy (data trang hiện tại), sorting 3-state + `aria-sort` — **56 tests (28 + 12 + 16) + 29 stories (19 + 4 + 6)**. (`31f5d05`, `8c5f716`)
- **Templates showcase (workers W6, W7, V2, D)** — 6 trang template trong `src/templates/`: Auth (sign-in/up split-hero useForm) · CRUD Table (toolbar search/filter + table đầy đủ + Drawer form zod focus-first-invalid + Popconfirm + toasts) · Dashboard admin · Kanban project · Landing (parallax) · Settings (tabs + theme live) — **9 story exports**. (`69e7e42`, `417f089`, `3a55922`, `31f5d05`)
- **Storybook & docs infra (worker W8 + lead)** — trang Introduction docs + toolbar dark-mode `@storybook/addon-themes` (đặt `data-bp-theme` trên body preview) + manager brand + canvas padding 24px · taxonomy stories chuẩn hoá 7 nhóm naming EN + autodocs order · recipes motion (Fade/Zoom/Collapse/Backdrop + parity docs) — 0 component code. (`8d8dad1`, `38943c4`, `26bfceb`, `2017ac6`)
- **App-fit apps (workers D, V2)** — `admin` dashboard layout ui-kit (Grid/Card giữ stat-intent — 7 tests) · `activity` ActivityPage migrate `StatTile`/`Card`/`Statistic`. (`d6db790`, `324b491`)
- **Accordion (worker D)** — nhóm panel mở-một kiểu PrimeReact/MUI: mặc định single-open (mở item mới **tự đóng** item đang mở), `multiple` → hành vi Collapse (nhiều mở cùng lúc); controlled `activeKey` (`string` khi single / `string[]` khi multiple) + `onChange` payload theo mode, `defaultActiveKey` uncontrolled; `items` dùng lại shape `CollapseItem` (key/label/children/disabled per-item); visual/motion kế thừa Collapse (`rounded-xl border-line bg-s2`, chevron xoay 180, animate grid-rows 0fr↔1fr) ; a11y `aria-expanded` + `aria-controls` trên header, panel `role="region"` labelledby — 9 tests + 6 stories. (`03e8ad2`)
- **Timesheet (worker W7)** — grid log giờ theo tuần (chấm công/approval): hàng = task/dự án (`rows`: `label` + `meta` + `values` đúng 7 phần tử T2→CN, `null` = ô trống), cột = 7 ngày **luôn bắt đầu Thứ 2** (vi T2 / en Mon, khác Calendar theo firstDayOfWeek), cell = giờ — `editable` → InputNumber compact clamp 0–24 step 0.5, bắn `onCellChange(rowKey, dayIndex, value|null)`; footer tổng cột + grand total `font-medium` + `tabular-nums`; nav prev/next bắn `onWeekChange(weekStart)` + grid remount replay `bp-fade-in`; locale `vi`/`en` (nhãn tuần `19–25 Th10 2026` / `Oct 19–25, 2026`, aria ô `Thứ 2 20/10 · Task A`); cột T7/CN nền `bg-s3/60` nhẹ; `loading` skeleton; `classNames` slots (`wrapper`/`header`/`row`/`cell`/`footer`) — 9 tests + 7 stories. (`dd740e5`)
- **Alert** — variant `filled` mặc định: nền đặc màu type, chữ/icon trắng, WCAG AA; `variant="outlined"` giữ look cũ. (`ab76cfe`)
- **InputNumber** — restyle PrimeReact stepper: SVG chevron, hover/active, keyboard ↑↓. (`ab76cfe`)
- **Pagination** — antd redesign: item vuông 32px outline `border-line`, active `bg-accent` chữ trắng `font-medium`, SVG chevron, ellipsis `···` jump ±5, disabled `text-ink3` không viền. (`ab76cfe`)
- **Carousel** — nút nav custom hoạt động thật trên swiper v14, prop `height`, `onSlideChange` dùng `realIndex` (loop-safe); stories 2→8. (`292b1a3`)
- **Calendar** — đồng bộ ngôn ngữ nút Pagination: ngày thường outline, selected accent đặc, today ring accent, adjacent disabled. (`292b1a3`)
- **Hooks native ×16** theo spec usehooks.com: `useDebounce`, `useThrottle`, `useToggle`, `useLocalStorage`, `useSessionStorage`, `useMediaQuery`, `useWindowSize`, `useHover`, `useClickAway`, `useKeyPress`, `useTimeout`, `useCountdown`, `useCopyToClipboard`, `usePrevious`, `useDefault`, `useLockBodyScroll` — 60 behavior tests. (`4baf52b`)
- **Menu** đa cấp antd parity (vertical/horizontal, submenu không giới hạn cấp, auto-open nhánh chứa selectedKey, animate grid-rows, role `menu`/`menuitem`) + **Sidebar** collapsible 200↔80px icon-only qua `MenuCompactContext` — 24 tests + 7 stories. (`11bb127`)
- **useForm** native + peer-dep **zod ^4**: `values/errors/touched`, mode `onSubmit|onBlur|onChange`, submit sai → focus field đầu — 9 tests. (`375baae`)
- **Upload + UploadDropzone** — drag-drop, beforeUpload guard, danh sách file remove — 14 tests + 5 stories. (`55288b1`)
- **Field** — wrapper label + control + error/hint với id `aria-describedby` suy từ `htmlFor`. (`5615a9b`)
- **Subpath exports** component nặng (tách CSS khỏi barrel chính): `@wakii/ui-kit/carousel`, `./chart`, `./schedule`, `./editor`. (`5615a9b`, `463cef4`)
- **Z-index scale tokens**: `--z-dropdown < --z-popover < --z-modal < --z-toast < --z-tooltip`. (`5615a9b`)
- **Icon** — 48 icon path data gốc primeicons 7.0.0 (`size`/`className`/`aria-hidden`), refactor chevron 5 component dùng bộ chung. (`463cef4`)
- **List** (antd pattern: loading Skeleton + empty EmptyState + pagination client), **AvatarGroup** (stack overlap + max "+N"), **TreeSelect** (searchable, chọn leaf, trigger hiện đường dẫn) — 28 tests. (`530a4a1`)
- **DatePicker** range + showTime, **TimePicker** mới (stepper Giờ/Phút + "Bây giờ"), locale `vi`/`en` cho họ date — 25 tests. (`f4d1883`)
- **Alert** — nền `filled` tokenize `--alert-error/warning/info/success-filled` (shade 700 antd theo type, look không đổi). (`1a086a8`)
- **Tokens scrim/mask** — thang `--scrim-1..4` theme-independent phủ media (bullet indicator/nav button/backdrop) + `--mask` mới cho overlay drawer/modal (BlockUI chuyển `var(--mask)` + z-token, chữ trắng; dark đậm hơn 0.6); thêm `--fs-h3` 15px. (`1a086a8`)
- **ContextMenu** — keyboard nav ArrowUp/Down/Home/End (bỏ qua item disabled), `role="menuitem"` + `aria-disabled`, focus ring, menu `w-max` chống tràn viewport. (`1a086a8`)
- **Tooltip/Popconfirm** — wire aria lên trigger qua `cloneElement`: Tooltip `aria-describedby` khi mở, Popconfirm `aria-haspopup="dialog"` + `aria-expanded`; bubble Popconfirm `role="dialog"` + shadow `--shadow-pop`. (`1a086a8`)
- **Tree/Steps/TabMenu/Menubar/Timeline** — a11y pass: Tree role `treeitem`/`group` + Icon chevron thay ký tự `▸`; Steps `aria-current="step"`, TabMenu `aria-current="page"`; Menubar focus ring + z-token, submenu item nhận `onClick`; Timeline label `text-label`. (`1a086a8`)
- **Dropdown** — đồng bộ menu family: `rounded-xl`, z-token `--z-dropdown`, focus ring accent, active state. (`1a086a8`)
- **DatePicker** — polish: placeholder range `text-ink4`→`text-ink` (contrast), panel `min-w-[300px]`, nút footer Today/OK to hơn. (`1a086a8`)
- **Schedule** — skin FullCalendar qua CSS vars: nút toolbar Button-like (bg-s2/border-line, active accent, focus ring), frame border/radius/today-bg ăn token (dark tự theo); prop `height` mặc định 650 — khung không nhảy giữa tháng 5/6 hàng. (`1a086a8`)
- **Select** — Icon check accent khi selected (single) + menu `min-h-[104px]` chống nhảy panel. (`1a086a8`)
- **CascadeSelect** — panel căn giữa trigger (`w-max` + translate), width theo content thay vì full-width. (`1a086a8`)
- **Table** — zebra dịu hơn: `bg-s3` → `bg-s3/40`. (`1a086a8`)
- **A11y/focus-ring sweep** — Pagination, Inplace (Icon times), PanelMenu, Segmented, ToggleButton thêm focus ring + radius `rounded-lg`; Tabs inactive `opacity-65`; Typography Title H1 weight 700; JSDoc props + stories/test mở rộng ~40 component; xoá test debug rác `pick-list/__d4.test.tsx`. (`1a086a8`)
- **Grid (Row/Col), Flex, Anchor** — layout + nav batch: `Row`/`Col` 24-col kiểu antd (`gutter` `[ngang, dọc]` qua negative-margin + col padding, span mobile-first `xs→xl` resolve matchMedia, wrap tự động) · `Flex` 1 trục (`gap` thang `small|middle|large|px`, `vertical`, justify/align) · `Anchor` in-page TOC scroll-spy (`items` nested, `affix` sticky, `offsetTop`, `getContainer`, `aria-current`) — 35 tests + stories EN. (`4fd4323`)
- **Popover, Watermark** — overlay batch: `Popover` panel neo trigger nội dung tự do (`title` divider + `content` ReactNode, `trigger` hover/click/focus, controlled `open`/`onOpenChange`, ESC + click-outside qua `useClickAway`, `role="dialog"` + trigger `aria-expanded`) · `Watermark` overlay tile SVG data-URI lặp (`rotate` −22° mặc định, `gap`/`offset`, màu resolve token `--ink3` + re-bake khi đổi theme, overlay `pointer-events-none` children vẫn bấm được) — 18 tests + stories EN. (`291ce0d`)

### Fixed

- **Tooltip token dark contrast (worker V2)** — `--tooltip-bg` dark-surface + chữ `--ink` (thay nền/độ tương phản cũ vi phạm AA). (`4a480c1`)
- **Radius sweep (worker W7)** — `rounded-3` legacy → `rounded-xl` đồng bộ 9 files qua 4 apps (chuẩn hoá theo quy ước radius control/card). (`1d42d3f`)
- **Scrollbar** — thumb mặc định `#5b5b5b` clash thiết kế (user báo): custom 8px pill `var(--line2)` track transparent (dark tự theo nhờ dark.css override `--line2` — 0 hex), `scrollbar-width: thin` + ⚠️ macOS overlay scrollbar → chuyển thành thin persistent: hành vi chấp nhận có chủ đích (nhất quán cross-app). (`8013033`)
- **InputNumber stepper** — nút lập flush container: radius CHỈ góc ngoài (up `rounded-tr-lg`, down `rounded-br-lg`; góc trong = 0, container `overflow-hidden` clip theo `rounded-lg`), active `opacity-70` thay `scale-95` (scale co nút làm hở viền) — kèm 4 stories demo `useFieldArray` cho Field. (`e94b3e4`)
- **Dark theme không ăn**: `@import "./themes/dark.css"` đứng sau rule thường bị drop theo spec CSS — chuyển lên đầu `tokens.css`. (`ab76cfe`)
- **Carousel nút prev/next chết** trên swiper v14 (init trong render → refs null lúc `onBeforeInit`) — test click-đổi-realIndex chặn regression. (`292b1a3`)
- **17 story file 0-export** bị Storybook indexer drop: 12 file dựng dở viết lại story matrix + 5 component menu-family tạo stories mới — index **51 → 79 titles, 190 stories**. (`6f4c9a0`)
- stories Pagination sai type meta/args sau merge main (TS2322/TS2353). (`a55b2fe`)
- **useFocusTrap** — dialog không có element focusable nào (vd image preview chỉ có img): giữ focus trên container thay vì cho Tab thoát ra ngoài (WAI-ARIA modal). (`1a086a8`)

### Đồng bộ consumer (cùng đợt)

- `remote-tasks`: selector test Skeleton/aria-busy cập nhật theo DOM mới sau migration ui-kit (PR #44). (`c056e92`, `3197ef1`)
