# Changelog — @wakii/ui-kit

Format theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); đánh số hướng SemVer.
ui-kit **consumed qua source** (ADR-0009) nên "release" = điểm merge PR vào `main`;
mục `[Unreleased]` gom các batch giữa 2 lần merge.

## [Unreleased] — 2026-10-17/18 (story VU-53 UI redesign)

### Added

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

### Fixed

- **Dark theme không ăn**: `@import "./themes/dark.css"` đứng sau rule thường bị drop theo spec CSS — chuyển lên đầu `tokens.css`. (`ab76cfe`)
- **Carousel nút prev/next chết** trên swiper v14 (init trong render → refs null lúc `onBeforeInit`) — test click-đổi-realIndex chặn regression. (`292b1a3`)
- **17 story file 0-export** bị Storybook indexer drop: 12 file dựng dở viết lại story matrix + 5 component menu-family tạo stories mới — index **51 → 79 titles, 190 stories**. (`6f4c9a0`)
- stories Pagination sai type meta/args sau merge main (TS2322/TS2353). (`a55b2fe`)
- **useFocusTrap** — dialog không có element focusable nào (vd image preview chỉ có img): giữ focus trên container thay vì cho Tab thoát ra ngoài (WAI-ARIA modal). (`1a086a8`)

### Đồng bộ consumer (cùng đợt)

- `remote-tasks`: selector test Skeleton/aria-busy cập nhật theo DOM mới sau migration ui-kit (PR #44). (`c056e92`, `3197ef1`)
