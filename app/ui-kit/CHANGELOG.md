# Changelog — @wakii/ui-kit

Format theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); đánh số hướng SemVer.
ui-kit **consumed qua source** (ADR-0009) nên "release" = điểm merge PR vào `main`;
mục `[Unreleased]` gom các batch giữa 2 lần merge.

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
