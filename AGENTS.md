# AGENTS.md — design system `@wakii/ui-kit` cho AI agents

Tài liệu này cho AI agent đọc TRƯỚC khi viết UI dùng ui-kit. Recipes code đầy đủ:
[docs/ai/recipes.md](docs/ai/recipes.md). API sống: Storybook :6006. Đổi behavior:
[app/ui-kit/CHANGELOG.md](app/ui-kit/CHANGELOG.md).

## Bản đồ feature → components

| Feature cần làm | Dùng components |
|---|---|
| Login / Register / form có validate | `useForm` + `zod` (schema) + `Field` + `Input` + `Button` — recipe 1 |
| Trang CRUD (bảng + tìm kiếm + sửa) | `Table` + `Select` (filter) + `Pagination` + `Modal` (form) + `message` — recipe 2 |
| Thanh filter | `Select` + `Input` (allowClear) + `Button` reset — recipe 3 |
| Wizard nhiều bước | `Steps` + state `current` + `Button` — recipe 4 |
| Upload kèm preview | `Upload` / `UploadDropzone` + `Progress` + `Image` — recipe 5 |
| Dashboard | `Card` + `Icon` + pill delta + `Chart` + `Timeline` + `EmptyState` — recipe 6 |
| Master-detail | `List`/`Avatar` + `Drawer` — recipe 7 |
| Thông báo | `message.*` (toast gọn) / `notification` (có title) / `Badge` trên bell — recipe 8 |
| Trang settings | `Tabs` + `Switch` + `Field`/`Input` — recipe 9 |
| Landing hero | `Button` + `Tag` + `Typography` + `Divider` + `Space` — recipe 10 |
| Landing sống động (hero trôi + block hiện dần + KPI đếm số + panel thu/mở) | `Parallax` + `Reveal` + `CountUp` trong `Statistic`/`Row`/`Col` — recipe 16 · kết hợp `Fade`/`Zoom`/`CollapseTransition` — recipe 17 |
| Nav app | `Sidebar` (collapsible) + `Menu` đa cấp + `MenuCompactContext` tự icon-only |
| Menu ngang | `Menubar` (hover dropdown) · `MegaMenu` (panel multi-column mega) · `TabMenu` (tabs nav) · `SplitButton` · `Dropdown` · `ContextMenu` |
| Menu trượt cấp (panel/hamburger) | `SlideMenu` (translateX giữa cấp, back + ESC) — recipe 18 |
| Date/time | `DatePicker` (range/showTime, locale vi/en) · `TimePicker` · `Calendar` |

## Layout & Nav — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Row`/`Col` | 24-col responsive grid — KPI rows, dashboard card mosaics, form column splits | `gutter` on `Row` (number or `[h, v]` px — antd mechanic: negative margin + col padding) | `Col span={24} md={12} xl={6}` mobile-first (xs→xl resolve qua matchMedia) · wrap `Card`/`Statistic` dashboards · nest rows for sub-layouts |
| `Flex` | One-axis layout fast — toolbars, button rows, stacked forms (skip 24-col math) | `gap` (`'small' \| 'middle' \| 'large'` \| px, default 8) | `vertical` for stacked form fields · justify/align raw CSS values · lighter than `Row`/`Col` when columns don't matter |
| `Anchor` | In-page TOC with scroll-spy — docs, long settings, detail pages | `items` (`href: '#section-id'` + nested `children` for sub-levels) | `affix` sticky rail beside long content · `offsetTop` to clear sticky headers · `onClick` for analytics · `getContainer` for inner scroll areas |
| `Layout` | App frame — Header/Content/Footer/Sider zones (antd Layout parity) | `Layout.Sider` (`width`/`collapsed`/`collapsedWidth` — mặc định 200↔80 khớp Sidebar) | `Layout hasSider` + `Sidebar` inside Sider · `Header sticky` top bar · `useSiderCollapsed()` cho UI đọc trạng thái thu gọn |

## Menu family — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `MegaMenu` | Top bar + panel dropdown MULTI-COLUMN (2 cấp: group = cột → leaf) — landing/app header nhiều nhóm chức năng | `items[].children` (mỗi group render 1 cột, grid tự theo số group) | hover HOẶC click mở · ESC/click-ngoài/leave đóng (trả focus trigger) · `role=menu` + `aria-expanded` · leaf `danger` đỏ · `icon` từ bộ Icon |
| `SlideMenu` | Menu trượt ngang GIỮA CÁC CẤP (panel hẹp, mobile/hamburger, cây sâu không giới hạn) | `items[].children` (đệ quy — translateX(-100%×depth), 0 deps) | back bar chevron-left + nhãn cấp cha · ESC pop cấp · trang ẩn `inert` + `aria-hidden` · `ariaLabel` cho landmark nav |

So sánh nhanh: `Menubar` = dropdown 1 cấp gọn · `MegaMenu` = panel đa cột duyệt theo nhóm · `SlideMenu` = cấp sâu trong không gian hẹp — recipe 18.

## Data Display — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Avatar` | Identity chip for a user/entity — letter initials by default, photo when `src` loads (fade-in; broken src falls back to initials) | `src` (falls back to initials children — on load fail too) | `AvatarGroup` (stacks) · `List` rows · `Card` extra |
| `AvatarGroup` | Stacked team/assignee faces with overflow | `max` — folds the rest into a "+N" pill whose tooltip lists hidden names | `Card` head extra · `Table` assignee cell · `Tooltip` built-in per avatar |
| `Badge` | Status pill (task/activity variants) OR antd-style count badge — corner count on children, standalone status dot | `variant` pill · `count`+`overflowCount` (99+) · `dot` · `status`+`text` · `offset` | `Table` status cells · bell `count` corner · filter status legend |
| `Card` | Grouped content panel with head/body/actions | `title` (pair with `hoverable` for clickable cards) · `loading` skeleton body · `size="small"` dense | `Card`+`Statistic` dashboard · `Card`+`Chart` · `Card`+`List` |
| `Carousel` | Sliding content — hero banner, media strip, onboarding steps | `itemsPerView` (1 = hero, 3-4 = card rail) | `Carousel`+`Image` gallery · built-in indicators/navigators/keyboard |
| `Chart` | Data viz: bar/line/pie/doughnut/radar | `config` (chart.js shape, per-dataset colors; per-dataset `type` for mixed) | `Card`+`Chart` dashboard · `fallback` node for missing peer-dep `chart.js` · heavy: subpath `@wakii/ui-kit/chart` (rời barrel 0.6.0) |
| `Collapse` | Progressive disclosure — FAQ, settings sections, logs | `items` (key/label/children, per-item `disabled`) · `accordion` (one open at a time) | inside `Card` body · default-open key via `defaultActiveKeys` |
| `Descriptions` | Label:value readout of an entity (task detail, meta panel) | `items` · `size="small"` + `colon` | `Drawer`/`Modal` detail pane · `Card` body · `bordered` for dense data |
| `Divider` | Separate/space content sections | `children` — text label embedded in the rule · `orientation="left|right"` | `Typography` sections · landing hero · settings groups |
| `Draggable` / `DropZone` | Native HTML5 drag & drop primitives — reorder lists, drop targets (0 deps) | `Draggable data` (JSON payload qua dataTransfer, MIME riêng) · `DropZone onDrop(data)` parse ngược | `DragDropProvider` + keyboard: Space nhặt (`aria-pressed`) → Arrows zone → Enter thả / Esc hủy · `Draggable handle` giới hạn vùng kéo · `disabled` khoá card · `DropZone activeClass` thay highlight · `accept` lọc theo `dataTransfer.types` · ⚠️ không hỗ trợ touch — peer-dep dnd-kit nếu cần |
| `Editor` | Rich text (Tiptap v3) — notes, descriptions, inline HTML content | `content`+`onChange` (HTML string) · `placeholder` · `editorRef` imperative access | `fallback` node when peer-dep `@tiptap/*` missing · heavy: subpath `@wakii/ui-kit/editor` (rời barrel 0.6.0) |
| `Galleria` | Swipeable image gallery with dot indicators | `images` (per-image `caption` optional) | `Image` (click-to-zoom) for detail view · `Carousel` for non-image slides |
| `Image` (`UiImage`) | Image with click-to-zoom preview overlay | `alt` (also the preview dialog's aria-label) | `Galleria` grids · `Upload` preview · `Table` attachment cells |
| `KanbanBoard` | Kanban board — `columns` controlled (consumer sở hữu state), card kéo thả giữa/vị trí trong cột | `onCardMove(cardKey, fromColKey, toColKey, toIndex)` — toIndex là vị trí CUỐI sau khi card rời nguồn | `wipLimit` cột đầy từ chối drop + `border-st-fail` + aria-live · `tag`→Tag · `left` slot→Avatar · `renderCard` custom body · keyboard full (Tab → Space → ↑↓ vị trí / ←→ cột → Enter/Esc) · ⚠️ native DnD không touch |
| `List` | Repeating rows from data — feeds, task digests | `renderItem` (full row control) | `List`+`Avatar`+`Tag` rows · `pagination` client-side · built-in `loading` skeleton + `EmptyState` |
| `OrgChart` | Org tree dọc — company/team hierarchy, approval chains, reporting lines | `data` root đơn (`type` `'dept'\|'person'` đổi nền+icon) · `defaultCollapsedKeys` gập nhánh sẵn | `selectedKey`+`onSelect` highlight node (viền accent + aria-selected) · chevron góc card collapse subtree · connector line thuần CSS (0 đo đạc) · `role=tree/treeitem/group` |
| `Schedule` | Month calendar (FullCalendar dayGrid) for date-driven events — sprints, deadlines, bookings | `events` (+ `onEventClick`) | `fallback` node when peer-dep `@fullcalendar/*` missing · `Card` wrapper · heavy: subpath `@wakii/ui-kit/schedule` |
| `Segmented` | Compact single-choice switcher with no panels — view period, density, sort mode | `options` (`disabled` per-option) + controlled `value`/`onChange` | swap for `Tabs` when you don't need content panels · toolbar/filter-bar headers |
| `Skeleton` | Loading placeholder mirroring the real layout before data lands | `variant` (text/row/card/circle/button) + `count` | stack `circle`+`text`+`row` to compose a card · `Table loading` renders its own — prefer that for grids · `classNames` slots (`wrapper`/`bone`) |
| `Statistic` | Big-number KPI readout (title + value + prefix/suffix) | `value` (+ `prefix`/`suffix`) | `Card` dashboards · `valueStyle` to color by status · tabular-nums built in |
| `Steps` | Horizontal wizard progress header (done/current/waiting) | `current` (prop-driven, no internal state) | `Button` next/back beneath it (recipe 4) · `aria-current="step"` built in |
| `Table` | Data grid — sort/filter/paginate/select for CRUD backbones | `columns` (`sortable`/`filterable`/`render`/`align`) | recipe 2 CRUD · `virtual` for 5k+ rows · `selectionMode` for bulk actions · `globalFilter` · `expandable` master-detail rows (recipe 13) · `classNames` slots (`wrapper`/`header`/`row`/`cell`) |
| `Timesheet` | Weekly hours grid — rows = tasks/projects × 7 day columns (always Mon-start), cell = hours; row/column/grand totals built in for timesheet approval | `rows` (+ `editable` → `onCellChange(rowKey, dayIndex, value)`, clamp 0–24 step 0.5) | `Statistic` weekly total (recipe 15) · `week` + `onWeekChange` prev/next nav · `locale` vi/en · weekend columns shaded · `loading` skeleton |
| `Tabs` | Switch between content panels in place — settings, detail views | `items` (+ controlled `activeKey`/`onChange`) | settings pages (recipe 9) · `Segmented` when panels aren't needed · `classNames` slots (`wrapper`/`tablist`/`tab`/`panel`) |
| `Tag` | Tiny label chip — statuses, metadata; `Tag.Checkable` for filter chips | `closable`+`onClose` (consumer removes) · Checkable `checked`+`onChange` | `Table` status cells · `Checkable` chip groups in filter bars · `List` row meta |
| `Timeline` | Vertical activity feed — dot + text + time per entry | `items` (per-item `color` dot, `label` time) · `mode="alternate|left|right"` (label column) · `pending` hollow dot | `Card` body feeds · audit/history panels (recipe 6) · deploy logs with "rolling out…" tail |
| `Tree` | Expand/collapse hierarchy — file trees, category nav | `data` (+ `defaultExpandedKeys`; uncontrolled expand state) · `showLine` connector borders | side navigation panels · use `TreeSelect` when a value must be picked |
| `TreeTable` | Hierarchical data as a grid — file trees with columns, WBS/org with metadata | `data` (recursive `{key, children?, values}`) + `columns` (`header`/`align`/`render`) | `defaultExpandedKeys`/`expandedKeys` + `onRowToggle` · `selectionMode` single/checkbox (+ select-all đếm cả node gập) · indent `--sp-4` × depth · expand animate grid-rows 3-tier clip |
| `VirtualScroll` | Windowed list for 10k+ rows — mount only the visible window + buffer, GPU translate | `itemSize` (FIXED row height px — dynamic height is a known backlog) | `height` px or `'100%'` (measured after mount) · `onScrollEnd` fires once per bottom-hit for load-more · pair with `List`-style rows · NOT for `Table` (use `Table virtual`) |


## Forms — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `AutoComplete` | Free-text input with type-to-filter suggestions (search-as-type) | `suggestions` — `onChange` gives raw text, `onSelect` gives the picked value | `Field` wrap · `Button` submit · empty `suggestions` → dropdown never opens |
| `Calendar` | Month grid for inline date browsing/picking (no trigger field) | `value` + `onChange` (controlled selected day) | `locale="vi"\|"en"` · `range` + `onDayHover` (drives DatePicker) · `bare` inside panels |
| `CascadeSelect` | Hierarchical pick (region → city → ward) through expanding panel columns | `options` (nested `children` define the levels) | `value` is a path array `["hn","bd"]` · keyboard ↑↓/Enter/Esc on the trigger |
| `Checkbox` | Single on/off decision with a visible label · tri-state parent (chọn một phần) | `checked` boolean\|`null` (null = indeterminate — dash + `aria-checked="mixed"`) · `indeterminate` override kiểu antd + `onChange(bool)` | `disabled` · inside `Field` · select-all header điều khiển list con (cycle true→null→false) · prefer `Switch` for instant-apply settings |
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

## General — bổ sung parity P0/P1 (2026-10-18, worker W6)

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Link` | Inline anchor trong câu văn / standalone nav link — màu accent tự hover | `underline` (`'none'|'hover'|'always'`, mặc định `'hover'`) | `disabled` bỏ href + `aria-disabled` + swallow click · passthrough `target`/`rel` cho external · focus ring chuẩn |
| `Affix` | Sticky wrapper bám mép khi scroll — toolbar/filter-bar nổi | `offsetTop` (mặc định 0; `offsetBottom` → bottom mode) | `onChange(affixed)` chỉ fire khi ĐỔI (không fire lúc mount) · CSS sticky thuần 0 deps · `target()` chỉ đích danh scroll container |
| `QRCode` | SVG QR cho link thanh toán / chia sẻ / check-in | `value` (`size` mặc định 160) | `errorLevel` L/M/Q/H (mặc định M) · màu tokens `--ink` trên `--c-s1` (dark tự cascade) · `role="img"` + aria-label theo value · vendored qrcode-generator MIT — không deps runtime |

## Theming & Hooks — when to use

| Component / Hook | Use when | Most valuable prop / arg | Common combos |
|---|---|---|---|
| `UiKitProvider` | Scope a theme subtree — dark mode or runtime token overrides without re-render | `theme` — `'dark'` or object `{ accent, accentHi, canvas, s1/s2/s3, ink/ink2/ink3, line, done/doing/fail }` (13 keys → CSS vars cascade) | wrap app root or a panel · `accent`/`accentHover` shorthand for brand swap |
| `useFieldArray` | Dynamic rows in `useForm` (antd Form.List parity) — invite lists, line items | `nameAt(i, key)` → name `list.<i>.<key>` keeps form auto-focus-first-invalid working | `fields`/`count` render · `append(row)`/`remove(i)`/`move(from,to)`/`swap(a,b)`/`update(i,patch)` · errors follow ROWS (rebuilt from fresh snapshot per op) · recipe 17 |
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

## Theming & Motion — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Parallax` | Scroll-linked drift — hero ảnh/banner landing trôi chậm hơn trang, tạo chiều sâu | `speed` (0–1; 0.3 phổ biến; `scale` phóng nhẹ theo drift) | wrap ảnh hero/section trong landing (recipe 16) · **an toàn a11y: tự tắt khi `prefers-reduced-motion`** (qua `useMediaQuery`) hoặc `disabled` · 0 deps — style ghi thẳng node, 0 re-render/frame |
| `Reveal` | Block hiện dần khi vào viewport — section landing, card list, KPI row | `direction` (`up` mặc định — dùng keyframe `bp-slide-up-in` có sẵn; `down/left/right` = fade + transition transform) | `delay` (stagger 0/150/300ms — fill backwards giữ ẩn trong lúc trễ) · `once` mặc định true (IO disconnect sau lần đầu), `once={false}` replay mỗi lần vào · fallback hiện luôn khi môi trường không có IntersectionObserver · reduced-motion tự tắt nhờ block global |
| `CountUp` | Đếm số ease-out cho KPI/metric — dashboard, landing stats | `value` (+ `duration` giây, mặc định 1.2; `0` = chạm đích ngay) | `decimals`/`format` (locale vi-VN, đơn vị) · `onDone` đúng 1 lần · `Statistic value={<CountUp …/>}` dashboard (recipe 16) · đổi `value` → animate tiếp từ số đang hiển thị (không nhảy về 0) · `tabular-nums` sẵn |
| `Fade` / `Zoom` | Wrapper enter/exit kiểu MUI cho card/popover nhỏ — hiện/thu có animation thay vì biến mất cứng | `in` (exit chạy XONG mới unmount — state machine kiểu Modal) | `unmountOnExit={false}` giữ DOM, hold `opacity-0` · `duration` ms override qua inline style (class giữ literal cho Tailwind) · keyframe `bp-fade/zoom-in/out` có sẵn · reduced-motion tắt nhờ block global |
| `CollapseTransition` | Thu/mở theo chiều cho FAQ/details panel dưới nút — height động không đo DOM | `in` | grid-rows `0fr↔1fr` (0 keyframe height) · **padding đặt SẶC trong children — tầng `overflow-hidden` phải clip sạch** · barrel đổi tên tránh trùng `Collapse` (precedent `UiImage`) · reduced-motion tắt nhờ block global |
| `Backdrop` | Scrim toàn màn đứng sau modal/composer/loading — bấm ra ngoài để đóng | `open` + `onClick` (controlled — consumer giữ state) | nền token `--scrim-4` + `z-[var(--z-modal)]` (không `bg-black/85`) · children slot cho Spinner giữa màn · không tự portal — đặt trong portal consumer (pattern Modal/Drawer) |

## Feedback & Overlay — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Alert` | Inline status banner that stays in the page flow (not transient) | `type` (`success`/`info`/`warning`/`error`) + `variant` (`filled` default; `outlined` for tinted look) | `description` detail line · `closable`+`onClose` dismissible · `classNames` slots (antd v5) |
| `BlockUI` | Lock a region in place while it is busy | `blocked` + `message` (label centered on the scrim) | wrap `Table`/`Card` during fetch · pair with `Spinner` outside the lock |
| `ContextMenu` | Right-click menu on a region — positioned at the pointer | `items` (key `'---'` = divider; `danger`/`disabled` per item) | `onItemClick` switch by key · arrow-key nav + ESC + outside-click built-in |
| `Drawer` | Side panel for detail/form without leaving context (portal, focus trap, scroll lock) | `open` + `onClose` (ESC, mask click, × wired) | `width` (default 378 antd) · `footer` action row · `Descriptions` as body · `classNames` slots |
| `Dropdown` | Button-triggered action menu | `items` + `onItemClick` | `trigger` = `Button` · `'---'` divider · `danger`/`disabled` per item · ArrowUp/Down/Home/End + `role=menu/menuitem` built-in |
| `Message` | Transient global toast — static API, 3s auto-dismiss | `message.success\|info\|warning\|error(content)` | call anywhere (no React state) · `classNames` slots |
| `Modal` | Blocking confirm/dialog on top of the page (portal, focus trap, scroll lock) | `open` + `onOk`/`onCancel` (ESC + mask + × all cancel) | `danger` red OK · `confirmLoading` locks both buttons · `okText`/`cancelText` · `classNames` slots |
| `Notification` | Rich toast with title + description — static API, 4.5s | `notification.success(title, description?)` | manual × close built-in · `classNames` slots |
| `Popconfirm` | Confirm bubble anchored to a trigger (delete guard) | `open` (controlled) + `onConfirm`/`onCancel` | `danger` red icon/OK · `title` + `description` · ESC = cancel · `okText`/`cancelText` |
| `Popover` | Rich anchored panel — free `content` ReactNode (lists, links, mini actions), unlike Tooltip's text-only hint | `content` (any ReactNode; pair with `title` for the divider head) | `trigger` `hover\|click\|focus` (default hover) · controlled `open`/`onOpenChange` · `placement` top/bottom · ESC + click-outside close built in |
| `Progress` | Line progress bar with % readout | `percent` (clamped 0–100) | `status="exception\|success"` recolors bar · `showInfo={false}` hides % |
| `Result` | Full-area status page (success/error/404/500/warning/info) | `status` (drives icon, color, default title) | `title`/`subTitle` override · `extra` action buttons |
| `Spinner` | Inline busy indicator (ring/dots/bars) | `label` (REQUIRED aria-label) | `size` (`sm`/`md`/`lg`) + `color` (`inverse` on dark surfaces) · pair with `BlockUI` scrim |
| `Tooltip` | Hover/focus hint bubble (top/bottom) — portal-free, wraps the trigger in place | `title` (bubble content) · `placement` `top`/`bottom` | wrap any focusable trigger · `aria-describedby` auto-wired · ESC dismisses |
| `Watermark` | Content guard overlay — repeated diagonal text tile over previews/documents/drafts | `content` (string or `string[]` for multi-line) | wraps any block (children stay interactive — overlay `pointer-events-none`) · `rotate`/`opacity`/`font`/`fontColor` custom tile · corner-anchored via `left`/`top`/`width`/`height` · dark theme re-bakes the tile automatically |

## Quy tắc BẮT BUỘC (vi phạm = review fail)

1. **Tokens-only** — không hex/arbitrary màu trong className: dùng `bg-s1/s2/s3`, `text-ink/ink2/ink3/ink4`, `border-line/line2`, `text-accent`, `text-st-fail/done/doing`, `bg-canvas`. Cần biến thể → opacity của token (`bg-accent/10`), không tự chế.
2. **Dark theme** — `data-bp-theme="dark"` trên `<html>` hoặc node bao; host import `styles/themes/dark.css` 1 lần. Component KHÔNG code riêng cho dark (CSS var tự cascade).
3. **Z-index** — chỉ `z-[var(--z-dropdown|popover|modal|toast|tooltip)]` (1000<1030<1050<1070<1090). Cấm `z-30`/số cứng.
4. **Focus** — `focus-visible:ring-2 focus-visible:ring-accent/40` (KHÔNG ring-offset — chuẩn user duyệt, hết "viền đôi"). Cấm `focus-visible:outline-2 outline-accent` lệch chuẩn.
5. **Sizes** — control cao `h-8` (small) / `h-9` (middle mặc định) / `h-10` (large).
6. **Motion** — 150–200ms + easing token (`--ease-enter/exit`); keyframes dùng sẵn `bp-fade-in`, `bp-zoom-in`, `bp-slide-up-in`, `bp-switch-pop` (vd `animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]`). `prefers-reduced-motion` tự tắt nhờ block global.
7. **Radius** — controls `rounded-lg` · cards/modal/panel `rounded-xl` · switch/tag/handle `rounded-pill`.
8. **Shadow** — chỉ `var(--shadow-pop|lift)`; micro-shadow riêng phải có lý do ghi rõ.
9. **Icon** — luôn `<Icon name="…" size={n} />` từ bộ primeicons (48 tên — xem `src/ui/icons`). Cấm tự vẽ SVG chevron/glyph.
10. **A11y tối thiểu** — icon-only button phải có `aria-label`; menu: `role=menu/menuitem` + `aria-expanded`; selected: `aria-current`; switch: `role="switch"` + `aria-checked`; icon badge trang trí: `aria-hidden`.

## Anti-patterns (đã xảy ra — đừng lặp)

- ❌ Tự vẽ `<svg>` chevron/glyph thay `<Icon>` (lệch bộ, trùng path)
- ❌ `rounded-2`/`rounded-3` (legacy — chuẩn `rounded-lg` control / `rounded-xl` card)
- ❌ `rgba(0,0,0,…)` cứng ngoài shadow (dark vỡ) — dùng `bg-black/85` hoặc token `ink/*`
- ❌ ClassName string surgery ghép điều kiện (dễ mâu thuẫn utility) — viết tường minh từng biến thể
- ❌ `!important`/`!bg-…` trừ khi override CSS third-party
- ❌ State kéo theo re-render churn cho thư viện so-tham-chiếu-theo-reference (vd swiper/react) — dùng imperative ref + classList
- ❌ Story file 0 `export const` (indexer drop — phải có ≥1 story mỗi file)
- ❌ Story meta gắn `component:` khi story chỉ có `render: () => …` và component có required props — StoryObj suy `args` BẮT BUỘC → TS2322 chặn push. Fix: meta không gắn `component` (`satisfies Meta` không generic — pattern `image.stories`); chỉ gắn `component:` khi mọi story truyền đủ `args` (pattern `galleria.stories`)

## Ghi nhớ vận hành

- ui-kit **consumed qua source** (`main/types → src/`): sửa là thấy ngay, KHÔNG build.
- Peer-dep consumer tự cài: `zod` (useForm) · `swiper` (subpath carousel) · `chart.js` · `@tiptap/*` · `@fullcalendar/*` (optional).
- Component nặng import qua **subpath**: `@wakii/ui-kit/carousel|chart|schedule|editor` — KHÔNG có ở barrel chính (`Carousel` từ 0.5.0; `Chart`/`Schedule`/`Editor` từ 0.6.0 — types tương ứng vẫn export type-only từ barrel).
- Zod schema = source of truth validate; `mode: 'onSubmit' | 'onBlur' | 'onChange'`; sai → `errors.field` + focus tự vào `[name=…]` đầu tiên.
