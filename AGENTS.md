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
| Nav app | `Sidebar` (collapsible) + `Menu` đa cấp + `MenuCompactContext` tự icon-only |
| Menu ngang | `Menubar` (hover dropdown) · `TabMenu` (tabs nav) · `SplitButton` · `Dropdown` · `ContextMenu` |
| Date/time | `DatePicker` (range/showTime, locale vi/en) · `TimePicker` · `Calendar` |

## Data Display — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Avatar` | Identity chip for a user/entity — letter initials by default, photo when `src` loads (fade-in) | `src` (falls back to initials children) | `AvatarGroup` (stacks) · `List` rows · `Card` extra |
| `AvatarGroup` | Stacked team/assignee faces with overflow | `max` — folds the rest into a "+N" pill whose tooltip lists hidden names | `Card` head extra · `Table` assignee cell · `Tooltip` built-in per avatar |
| `Card` | Grouped content panel with head/body/actions | `title` (pair with `hoverable` for clickable cards) | `Card`+`Statistic` dashboard · `Card`+`Chart` · `Card`+`List` |
| `Carousel` | Sliding content — hero banner, media strip, onboarding steps | `itemsPerView` (1 = hero, 3-4 = card rail) | `Carousel`+`Image` gallery · built-in indicators/navigators/keyboard |
| `Chart` | Data viz: bar/line/pie/doughnut/radar | `config` (chart.js shape, per-dataset colors; per-dataset `type` for mixed) | `Card`+`Chart` dashboard · `fallback` node for missing peer-dep `chart.js` |
| `Collapse` | Progressive disclosure — FAQ, settings sections, logs | `items` (key/label/children; several can be open at once) | inside `Card` body · default-open key via `defaultActiveKeys` |
| `Descriptions` | Label:value readout of an entity (task detail, meta panel) | `items` | `Drawer`/`Modal` detail pane · `Card` body · `bordered` for dense data |
| `Divider` | Separate/space content sections | `children` — text label embedded in the rule | `Typography` sections · landing hero · settings groups |
| `Galleria` | Swipeable image gallery with dot indicators | `images` (per-image `caption` optional) | `Image` (click-to-zoom) for detail view · `Carousel` for non-image slides |
| `Image` (`UiImage`) | Image with click-to-zoom preview overlay | `alt` (also the preview dialog's aria-label) | `Galleria` grids · `Upload` preview · `Table` attachment cells |
| `List` | Repeating rows from data — feeds, task digests | `renderItem` (full row control) | `List`+`Avatar`+`Tag` rows · `pagination` client-side · built-in `loading` skeleton + `EmptyState` |
| `Schedule` | Month calendar (FullCalendar dayGrid) for date-driven events — sprints, deadlines | `events` (+ `onEventClick`) | `fallback` node when peer-dep `@fullcalendar/*` missing · `Card` wrapper · heavy: subpath `@wakii/ui-kit/schedule` |
| `Segmented` | Compact single-choice switcher with no panels — view period, density, sort mode | `options` + controlled `value` | swap for `Tabs` when you don't need content panels · toolbar/filter-bar headers |
| `Skeleton` | Loading placeholder mirroring the real layout before data lands | `variant` (text/row/card/circle/button) + `count` | stack `circle`+`text`+`row` to compose a card · `Table loading` renders its own — prefer that for grids |
| `Statistic` | Big-number KPI readout (title + value + prefix/suffix) | `value` (+ `prefix`/`suffix`) | `Card` dashboards · `valueStyle` to color by status · tabular-nums built in |
| `Steps` | Horizontal wizard progress header (done/current/waiting) | `current` | `Button` next/back beneath it (recipe 4) · `aria-current="step"` built in |
| `Table` | Data grid — sort/filter/paginate/select for CRUD backbones | `columns` (`sortable`/`filterable`/`render`) | recipe 2 CRUD · `virtual` for 5k+ rows · `selectionMode` for bulk actions · `classNames` slots theming |
| `Tabs` | Switch between content panels in place — settings, detail views | `items` (+ controlled `activeKey`) | settings pages (recipe 9) · `Segmented` when panels aren't needed · `classNames` slots theming |
| `Tag` | Tiny label chip — statuses, metadata; `Tag.Checkable` for filter chips | `closable`+`onClose` · `checked` on Checkable | `Table` status cells · `Checkable` chip groups in filter bars · `List` row meta |
| `Timeline` | Vertical activity feed — dot + text + time per entry | `items` (per-item `color` dot) | `Card` body feeds · audit/history panels (recipe 6) |
| `Tree` | Expand/collapse hierarchy — file trees, category nav | `data` (+ `defaultExpandedKeys`) | side navigation panels · use `TreeSelect` when a value must be picked |
| `TreeSelect` | Pick one leaf from a hierarchy — searchable `Parent / Child` path | `treeData` (+ `searchable`) | inside `Field` forms · `clearable` in filter bars · leaf-only selection |


## Forms — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `AutoComplete` | Free-text input with type-to-filter suggestions (search-as-type) | `suggestions` — `onChange` gives raw text, `onSelect` gives the picked value | `Field` wrap · `Button` submit · empty `suggestions` → dropdown never opens |
| `Calendar` | Month grid for inline date browsing/picking (no trigger field) | `value` + `onChange` (controlled selected day) | `locale="vi"\|"en"` · `range` + `onDayHover` (drives DatePicker) · `bare` inside panels |
| `CascadeSelect` | Hierarchical pick (region → city → ward) through expanding panel columns | `options` (nested `children` define the levels) | `value` is a path array `["hn","bd"]` · keyboard ↑↓/Enter/Esc on the trigger |
| `Checkbox` | Single on/off decision with a visible label | `checked` + `onChange(bool)` | `disabled` · inside `Field` · prefer `Switch` for instant-apply settings |
| `Chips` | Multi-value tag input — Enter adds, × removes, Backspace pops the last | `value: string[]` + `onChange` | `placeholder` hint · `disabled` hides input + remove buttons · duplicates ignored |
| `ColorPicker` | Color choice: swatch + preset grid + native picker + hex field | `presets` (curated palette; `[]` = native + hex only) | `value` hex · `onChange` fires from preset/native/hex alike |
| `DatePicker` | Date pick through a trigger + calendar panel | `range` + `showTime` (with `locale` vi/en) | `value: Date \| [Date, Date]` · `now` injectable for tests · `prefix` icon · footer "Today"/OK |
| `Inplace` | Click-to-edit inline value (read mode → edit form → close) | `display` + `children` (the edit form) | `Input`/`Textarea` inside · `onClose` after closing the form |
| `InputMask` | Constrained format typing — `9`=digit, `a`=letter, `*`=alnum, others literal | `mask` | `placeholder` showing the format · `ariaLabel` for the accessible name · typing past an invalid char just stops |
| `InputNumber` | Numeric input with vertical stepper + ↑↓ + min/max clamp | `min`/`max`/`step` | `invalid` red border · blur snaps the display to the clamp · `value` is read at mount |
| `InputOTP` | N single-char cells with auto-advance + multi-cell paste | `length` | `value`/`onChange` as one joined string · `ariaLabel` per cell ("code 1…") · digits only |
| `Mention` | Textarea with @-triggered mention list | `suggestions` (filtered by the text after @) | ↑↓ + Enter/Esc keyboard pick · `value`/`onChange` is the full text · picks insert `"@Name "` |
| `Password` | Password field with show/hide toggle (+ optional strength meter) | `showStrength` | `ariaLabel` · `value`/`onChange` · wraps `Input` |
| `PickList` | Two-column transfer (source ⇄ target) | `source`/`target` + `onChange(source, target)` | multi-pick then chevron move · each listbox keyboard-navigable (↑↓ + Enter/Space) · `aria-multiselectable` |
| `Radio`/`RadioGroup` | Single choice among a few always-visible options | `RadioGroup options` + `value` | per-option `disabled` · standalone `Radio` for one-offs · prefer `Select` when options are many |
| `Slider` | Numeric pick on a track — single value or a range | `range: [lo, hi]` + `onRangeChange` | `step` snapping · keyboard ←↓/→↑ (clamped) · `ariaLabel` required (`role="slider"`) |
| `Switch` | Instant on/off setting toggle | `checked` + `onChange` | `size="small"` for dense rows · inside `Field`/settings `Tabs` · `role="switch"` + `aria-checked` built-in |
| `TimePicker` | HH:mm pick via stepper panel (+ "Now" shortcut) | `value` — Date keeps its date-part on change, string `"HH:mm"` emits epoch-day | `locale` vi/en · `now` injectable for tests · pairs with `DatePicker` `showTime` column |
| `ToggleButton` | Button with a pressed state (on/off action) | `checked` (exposed as `aria-pressed`) | `disabled` · clusters of toggles (filters/view switches) · unchecked = default variant look |
| `TreeSelect` | Pick a LEAF from a hierarchy, with search + clear | `treeData` (nested `children`; parents are headers, not pickable) | `searchable` filters by label/path · `clearable` × resets · trigger shows the `"A / B"` path |

## Theming & Hooks — when to use

| Component / Hook | Use when | Most valuable prop / arg | Common combos |
|---|---|---|---|
| `UiKitProvider` | Scope a theme subtree — dark mode or runtime token overrides without re-render | `theme` — `'dark'` or object `{ accent, canvas, ink, done, … }` (13 keys → CSS vars cascade) | wrap app root or a panel · `accent`/`accentHover` shorthand for brand swap |
| `useForm` | Form state + zod validation (RHF-style minimal API) | `schema` (zod = source of truth; `mode` = onSubmit/onBlur/onChange) | `Field`+`Input`+`Button` · errors land on `errors.field` + auto-focus first invalid |
| `useClickAway` | Close on outside interaction — dropdown, popover, menu | returned `ref` (attach to the inside element) | `Dropdown`/`Menu` builds · `useRef`-based popovers |
| `useFocusTrap` | Lock Tab focus inside a dialog, restore focus on close | `(ref, active)` — focus first focusable, cycle Tab, return to trigger | `Modal`/`Drawer` (built-in) · any custom `role="dialog"` |
| `useCopyToClipboard` | Copy-to-clipboard with feedback | returned `copy(text)` → boolean | `Button`+"Copied!" flash · `Input` copy-affordance |
| `useCountdown` | Ticking countdown — OTP resend, cooldown | `initialSeconds` (returns `{ remaining, restart, … }`) | `Button` disabled while counting · OTP/2FA UIs |
| `useDebounce` | Delayed value — search-as-you-type, expensive derivations | `delayMs` (default 500) | `Input` search → `Table`/`List` filter · API calls |
| `useThrottle` | Rate-limited value — scroll/resize handlers | `intervalMs` (default 500) | `useWindowSize` consumers · infinite-scroll triggers |
| `useTimeout` | Timeout as a component-safe effect | `delayMs` + `callback` (returns `{ start, clear, … }`) | toasts auto-dismiss · tooltip delays |
| `useToggle` | Boolean on/off state | `initialValue` (returns `[value, toggle]`) | `Collapse` custom triggers · sidebar collapsed · any show/hide |
| `useDefault` | State that falls back to a default when value is undefined | `defaultValue` | controlled/uncontrolled bridge · form field fallbacks |
| `usePrevious` | Value from the previous render | — (single arg) | transition/diff animations · change detection in effects |
| `useHover` | Hover state without CSS (JS-driven visuals) | returned `ref` | drag handles · canvas-like interactions CSS can't express |
| `useKeyPress` | Reactive "is key pressed" + optional callback | `targetKey` (e.g. `'Escape'`, `'Enter'`) | dialog ESC handlers (prefer built-in) · shortcut hints |
| `useLockBodyScroll` | Prevent background scroll while open | `locked` (default true) | `Modal`/`Drawer` (built-in) · fullscreen previews |
| `useMediaQuery` | Reactive matchMedia boolean | `query` (e.g. `'(min-width: 768px)'`) | responsive JS behavior · `prefers-reduced-motion` branches |
| `useWindowSize` | Live viewport width/height | — (no args) | virtualized lists · breakpoint-adjacent JS logic |
| `useLocalStorage` / `useSessionStorage` | Persistent (tab) / session state without effect boilerplate | `key` + `initialValue` | theme preference · drafts · wizard step memory |

## Feedback & Overlay — khi nào dùng

| Component | Use when | Most valuable prop | Common combos |
|---|---|---|---|
| `Alert` | Inline status banner that stays in the page flow (not transient) | `type` + `variant` (`filled` default; `outlined` for tinted look) | `description` detail line · `closable`+`onClose` dismissible · `classNames` slots (antd v5) |
| `BlockUI` | Lock a region in place while it is busy | `blocked` + `message` (label centered on the scrim) | wrap `Table`/`Card` during fetch · pair with `Spinner` outside the lock |
| `ContextMenu` | Right-click menu on a region | `items` (key `'---'` = divider; `danger`/`disabled` per item) | `onItemClick` switch by key · arrow-key nav + ESC built-in |
| `Drawer` | Side panel for detail/form without leaving context | `open` + `onClose` (ESC, mask click, × wired) | `width` (default 378 antd) · `footer` action row · `Descriptions` as body |
| `Dropdown` | Button-triggered action menu | `items` + `onItemClick` | `trigger` = `Button` · `'---'` divider · keyboard nav + `role=menu/menuitem` built-in |
| `Message` | Transient global toast — static API, 3s auto-dismiss | `message.success\|info\|warning\|error(content)` | call anywhere (no React state) · `classNames` slots |
| `Modal` | Blocking confirm/dialog on top of the page | `open` + `onOk`/`onCancel` (ESC + mask + × all cancel) | `danger` red OK · `confirmLoading` locks both buttons · `okText`/`cancelText` |
| `Notification` | Rich toast with title + description — static API, 4.5s | `notification.success(title, description?)` | manual × close built-in · `classNames` slots |
| `Popconfirm` | Confirm bubble anchored to a trigger (delete guard) | `open` (controlled) + `onConfirm`/`onCancel` | `danger` red icon/OK · `title` + `description` · ESC = cancel |
| `Progress` | Line progress bar with % readout | `percent` (clamped 0–100) | `status="exception\|success"` recolors bar · `showInfo={false}` hides % |
| `Result` | Full-area status page (success/error/404/500/warning/info) | `status` (drives icon, color, default title) | `title`/`subTitle` override · `extra` action buttons |
| `Skeleton` | Loading placeholder bones with shimmer | `variant` (text/row/card/circle/button) | `count` repeats a bone · compose circle+text+row for a loading card |
| `Spinner` | Inline busy indicator (ring/dots/bars) | `label` (REQUIRED aria-label) | `size` + `color` (`inverse` on dark surfaces) · pair with `BlockUI` scrim |
| `Tooltip` | Hover/focus hint bubble (top/bottom) | `title` (bubble content) | wrap any focusable trigger · `aria-describedby` auto-wired · ESC dismisses |

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

## Ghi nhớ vận hành

- ui-kit **consumed qua source** (`main/types → src/`): sửa là thấy ngay, KHÔNG build.
- Peer-dep consumer tự cài: `zod` (useForm) · `swiper` (subpath carousel) · `chart.js` · `@tiptap/*` · `@fullcalendar/*` (optional).
- Component nặng import qua **subpath**: `@wakii/ui-kit/carousel|chart|schedule|editor`.
- Zod schema = source of truth validate; `mode: 'onSubmit' | 'onBlur' | 'onChange'`; sai → `errors.field` + focus tự vào `[name=…]` đầu tiên.

| Component | Use when | Power props/combo |
|---|---|---|
| `AutoComplete` | Free-text input with type-to-filter suggestions (search-as-type) | `suggestions` · `onChange` raw text + `onSelect` picked value · empty `suggestions` → dropdown never opens · `Field` wrap |
| `Calendar` | Month grid for inline date browsing/picking (no trigger field) | `value` + `onChange` controlled day · `locale="vi"\|"en"` · `range` + `onDayHover` (drives DatePicker) · `bare` inside panels |
| `CascadeSelect` | Hierarchical pick (region → city → ward) through expanding panel columns | `options` nested `children` define levels · `value` is a path array `["hn","bd"]` · keyboard ↑↓/Enter/Esc built into the trigger |
| `Checkbox` | Single on/off decision with a visible label | `checked` + `onChange(bool)` · `disabled` · inside `Field` — prefer `Switch` for instant-apply settings |
| `Chips` | Multi-value tag input — Enter adds, × removes, Backspace pops the last | `value: string[]` + `onChange` · `placeholder` hint · `disabled` hides input + remove buttons · duplicates ignored |
| `ColorPicker` | Color choice: swatch + preset grid + native picker + hex field | `presets` curated palette (`[]` = native + hex only) · `value` hex · `onChange` fires from preset/native/hex alike |
| `DatePicker` | Date pick through a trigger + calendar panel | `range` + `showTime` + `locale` vi/en · `value: Date \| [Date, Date]` · `now` injectable for tests · `prefix` icon · footer "Today"/OK |
| `Inplace` | Click-to-edit inline value (read mode → edit form → close) | `display` + `children` (the edit form) · `onClose` after closing · pair `Input`/`Textarea` inside |
| `InputMask` | Constrained format typing — `9`=digit, `a`=letter, `*`=alnum, others literal | `mask` · `placeholder` showing the format · `ariaLabel` for accessible name · typing past an invalid char just stops |
| `InputNumber` | Numeric input with vertical stepper + ↑↓ + min/max clamp | `min`/`max`/`step` · `invalid` red border · blur snaps the display to the clamp · `value` is read at mount (uncontrolled internal) |
| `InputOTP` | N single-char cells with auto-advance + multi-cell paste | `length` · `value`/`onChange` as one joined string · `ariaLabel` per cell ("code 1…") · digits only · Backspace walks back |
| `Mention` | Textarea with @-triggered mention list | `suggestions` filtered by the text after @ · ↑↓ + Enter/Esc keyboard pick · picks insert `"@Name "` · `value`/`onChange` is the full text |
| `Password` | Password field with show/hide toggle (+ optional strength meter) | `showStrength` meter with --st-* colors · `ariaLabel` · `value`/`onChange` · wraps `Input` |
| `PickList` | Two-column transfer (source ⇄ target) | `source`/`target` + `onChange(source, target)` · multi-pick then chevron move · each listbox keyboard-navigable (↑↓ + Enter/Space) · `aria-multiselectable` |
| `Radio`/`RadioGroup` | Single choice among a few always-visible options | `RadioGroup options` + `value` · per-option `disabled` · standalone `Radio` for one-offs · prefer `Select` when options are many |
| `Slider` | Numeric pick on a track — single value or a range | `range: [lo, hi]` + `onRangeChange` · `step` snapping · keyboard ←↓/→↑ clamped · `ariaLabel` required (`role="slider"`) |
| `Switch` | Instant on/off setting toggle | `checked` + `onChange` · `size="small"` for dense rows · inside `Field`/settings `Tabs` · `role="switch"` + `aria-checked` built-in |
| `TimePicker` | HH:mm pick via stepper panel (+ "Now" shortcut) | `value` Date keeps its date-part on change, string `"HH:mm"` emits epoch-day · `locale` vi/en · `now` injectable for tests · pairs with `DatePicker` `showTime` |
| `ToggleButton` | Button with a pressed state (on/off action) | `checked` exposed as `aria-pressed` · `disabled` · clusters of toggles (filters/view switches) · unchecked = default variant look |
| `TreeSelect` | Pick a LEAF from a hierarchy, with search + clear | `treeData` nested `children` (parents are headers, not pickable) · `searchable` filters by label/path · `clearable` × resets · trigger shows the `"A / B"` path |

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

| Component | Use when | Power props/combo |
|---|---|---|
| `Alert` | Inline status banner that stays in the page flow (not transient) — filled by default, `outlined` for the tinted look | `type` (`success\|info\|warning\|error`) · `variant="outlined"` · `description` detail line · `closable`+`onClose` dismissible · `classNames` slots (antd v5) |
| `BlockUI` | Lock a region in place while it is busy — scrim + centered label over the wrapped content | `blocked` toggle · `message` label on the scrim · wrap `Table`/`Card` during fetch · pair with `Spinner` outside the lock |
| `ContextMenu` | Right-click menu on a region — positioned at the pointer | `items` (key `'---'` = divider, `danger`/`disabled` per item) · `onItemClick` switch by key · arrow-key nav + ESC + outside-click built-in |
| `Drawer` | Side panel for detail/form without leaving the page (portal, focus trap, scroll lock) | `open`+`onClose` (ESC, mask click, × wired) · `width` (default 378 antd) · `footer` action row · `classNames` slots |
| `Dropdown` | Button-triggered action menu — role=menu with full keyboard nav | `items` + `onItemClick` · `trigger` = `Button` · `'---'` divider · `danger`/`disabled` per item · ArrowUp/Down/Home/End built-in |
| `Message` | Transient global toast — static API, 3s auto-dismiss, no React state needed | `message.success\|info\|warning\|error(content)` · `classNames` slots (wrapper/icon/content) |
| `Modal` | Blocking confirm/dialog on top of the page (portal, focus trap, scroll lock) | `open` + `onOk`/`onCancel` (ESC + mask + × all cancel) · `danger` red OK · `confirmLoading` locks both buttons · `okText`/`cancelText` · `classNames` slots |
| `Notification` | Rich toast with title + description — static API, 4.5s, manual × close | `notification.success(title, description?)` · `classNames` slots (wrapper/title/content) |
| `Popconfirm` | Confirm bubble anchored to a trigger (delete guard) — ESC = cancel, role=dialog | `open` (controlled) + `onConfirm`/`onCancel` · `danger` red icon/OK · `title` + `description` · `okText`/`cancelText` |
| `Progress` | Line progress bar with % readout — values clamped to 0–100 | `percent` · `status="exception\|success"` recolors bar (red/green) · `showInfo={false}` hides % |
| `Result` | Full-area status page — icon + color + default title per status | `status` (`success\|error\|info\|warning\|404\|500`) · `title`/`subTitle` override · `extra` action buttons |
| `Skeleton` | Loading placeholder bones with shimmer wave | `variant` (`text\|row\|card\|circle\|button`) · `count` repeats a bone · compose circle+text+row for a loading card · `classNames` slots (wrapper/bone) |
| `Spinner` | Inline busy indicator — 3 variants, label is the required accessible name | `label` (REQUIRED aria-label) · `variant` (`ring\|dots\|bars`) · `size` sm/md/lg · `color` (`inverse` on dark surfaces) |
| `Tooltip` | Hover/focus hint bubble (top/bottom) — portal-free, wraps the trigger in place | `title` (bubble content) · `placement="top\|bottom"` · `aria-describedby` auto-wired · ESC dismisses |

| Component | Use when | Power props/combo |
|---|---|---|
| `UiKitProvider` | Scope a theme subtree — dark mode or runtime token overrides with zero re-render | `theme`: `'dark'` or object `{ accent, accentHi, canvas, s1/s2/s3, ink/ink2/ink3, line, done/doing/fail }` (13 keys → CSS vars cascade to descendants) · `accent`/`accentHover` shorthand for one-line brand swap · wrap app root or a single panel |
| `useForm` | Form state + zod validation with a minimal RHF-style API | `schema` (zod = source of truth) · `mode`: `'onSubmit' \| 'onBlur' \| 'onChange'` · errors land on `errors.field`, auto-focus first `[name]` invalid · combo: `Field` + `Input` + `Button` |
| `useClickAway` | Close on outside interaction — dropdown, popover, menu | returned `ref` attaches to the "inside" element · handler via ref (no re-bind) · combo: `Dropdown`/`Menu`/custom popover |
| `useFocusTrap` | Lock Tab focus inside a dialog; restore focus to trigger on close | `(ref, active)` — focuses first focusable (or container), cycles Tab, restores on deactivate · combo: `Modal`/`Drawer` (built in) or any custom `role="dialog"` |
| `useCopyToClipboard` | Copy-to-clipboard with user feedback | returned `[copiedText, copy]` — `copy(text)` → boolean success · combo: `Button` + "Copied!" flash, input copy affordance |
| `useCountdown` | Ticking countdown — OTP resend, cooldown lock | `initialSeconds` (+ `intervalMs`) → `{ remaining, restart, … }` · combo: `Button` disabled while counting |
| `useDebounce` | Delayed value — search-as-you-type, expensive derivations | `delayMs` (default 500) · combo: `Input` search → `Table`/`List` filter, API calls |
| `useThrottle` | Rate-limited value — scroll/resize/infinite-scroll handlers | `intervalMs` (default 500) · combo: `useWindowSize` consumers, scroll triggers |
| `useTimeout` | Component-safe timeout effect | `callback` + `delayMs` → `{ start, clear, … }` · combo: toast auto-dismiss, tooltip delays |
| `useToggle` | Boolean on/off state | `initialValue` → `[value, toggle]` · combo: `Collapse` custom triggers, sidebar collapsed, any show/hide |
| `useDefault` | State that falls back to a default when value is undefined | `defaultValue` · combo: controlled/uncontrolled bridge, form field fallbacks |
| `usePrevious` | Value from the previous render | single arg · combo: change detection in effects, transition diffs |
| `useHover` | Hover state without CSS — JS-driven visuals | returned `ref` · combo: drag handles, canvas-like interactions CSS can't express |
| `useKeyPress` | Reactive "is key pressed" + optional callback | `targetKey` (`'Escape'`, `'Enter'`…) + `onPress` · combo: ESC-close handlers (dialogs have it built in), shortcut hints |
| `useLockBodyScroll` | Prevent background scroll while open | `locked` (default true) · combo: `Modal`/`Drawer` (built in), fullscreen previews |
| `useMediaQuery` | Reactive matchMedia boolean, updates in real time | `query` (e.g. `'(min-width: 768px)'`) · combo: responsive JS behavior, `prefers-reduced-motion` branches |
| `useWindowSize` | Live viewport width/height | no args · combo: virtualized lists, breakpoint-adjacent JS logic |
| `useLocalStorage` / `useSessionStorage` | Persistent (tab) / session state without effect boilerplate | `key` + `initialValue` · combo: theme preference, drafts, wizard step memory |
