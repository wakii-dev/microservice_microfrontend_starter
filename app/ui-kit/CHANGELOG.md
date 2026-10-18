# Changelog — @wakii/ui-kit

Format theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); đánh số hướng SemVer.
ui-kit **consumed qua source** (ADR-0009) nên "release" = điểm merge PR vào `main`;
mục `[Unreleased]` gom các batch giữa 2 lần merge.

## [Unreleased] — 2026-10-17/18 (story VU-53 UI redesign)

### Added

- **Timesheet (worker W7)** — grid log giờ theo tuần (chấm công/approval): hàng = task/dự án (`rows`: `label` + `meta` + `values` đúng 7 phần tử T2→CN, `null` = ô trống), cột = 7 ngày **luôn bắt đầu Thứ 2** (vi T2 / en Mon, khác Calendar theo firstDayOfWeek), cell = giờ — `editable` → InputNumber compact clamp 0–24 step 0.5, bắn `onCellChange(rowKey, dayIndex, value|null)`; footer tổng cột + grand total `font-medium` + `tabular-nums`; nav prev/next bắn `onWeekChange(weekStart)` + grid remount replay `bp-fade-in`; locale `vi`/`en` (nhãn tuần `19–25 Th10 2026` / `Oct 19–25, 2026`, aria ô `Thứ 2 20/10 · Task A`); cột T7/CN nền `bg-s3/60` nhẹ; `loading` skeleton; `classNames` slots (`wrapper`/`header`/`row`/`cell`/`footer`) — 9 tests + 7 stories.
- **Gap P0 parity (worker W6)**: `Input.Search` (composite `Input.Search` antd — nút search dính phải, `onSearch` qua Enter/click, `enterButton` boolean|ReactNode, `loading` chặn phát thêm) · `Link` (antd Typography.Link/MUI Link — accent/hover accent-hi, underline `none|hover|always`, disabled bỏ href + chặn click) · `Affix` (sticky CSS thuần không deps — `offsetTop`/`offsetBottom`, `onChange` đo trên scroll container thật, dò ancestor overflow tự động + `target`) · `Table` prop `expandable` (API antd — cột expander tự inject chevron-down xoay 90 khi mở, `expandedRowRender`/`defaultExpandedRowKeys`/`rowExpandable`, `aria-expanded`) — 28 tests + 19 stories mới.
- **QRCode (worker W6)** — antd parity P1: SVG QR (`value`/`size` 160/`errorLevel` L|M|Q|H mặc định M/`bgColor`/`fgColor` tokens `--ink` trên `--c-s1`), thuật toán vendored single-file **qrcode-generator v1.4.4** (MIT, Kazuhiko Arase — không deps runtime, UTF-8 byte mode, auto version 1–40); `role="img"` + aria-label theo value, không dùng id/defs → không trùng id đa instance. Icon giữa (antd `icon`) chưa làm — backlog. 11 tests (finder/timing spec + behavior) + 5 stories.
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

- **Dark theme không ăn**: `@import "./themes/dark.css"` đứng sau rule thường bị drop theo spec CSS — chuyển lên đầu `tokens.css`. (`ab76cfe`)
- **Carousel nút prev/next chết** trên swiper v14 (init trong render → refs null lúc `onBeforeInit`) — test click-đổi-realIndex chặn regression. (`292b1a3`)
- **17 story file 0-export** bị Storybook indexer drop: 12 file dựng dở viết lại story matrix + 5 component menu-family tạo stories mới — index **51 → 79 titles, 190 stories**. (`6f4c9a0`)
- stories Pagination sai type meta/args sau merge main (TS2322/TS2353). (`a55b2fe`)
- **useFocusTrap** — dialog không có element focusable nào (vd image preview chỉ có img): giữ focus trên container thay vì cho Tab thoát ra ngoài (WAI-ARIA modal). (`1a086a8`)

### Đồng bộ consumer (cùng đợt)

- `remote-tasks`: selector test Skeleton/aria-busy cập nhật theo DOM mới sau migration ui-kit (PR #44). (`c056e92`, `3197ef1`)
