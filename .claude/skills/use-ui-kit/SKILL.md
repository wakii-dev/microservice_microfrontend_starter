---
name: use-ui-kit
description: Use khi viết/dựng UI với @wakii/ui-kit — "dùng component nào cho X", "customize component", "import chart/carousel", "dark mode", "gặp lỗi a11y/token/test UI". Component-map theo tác vụ + tokens + customize + subpath + a11y + pitfalls. KHÔNG dùng khi đụng BE/contract, hay sửa chính ui-kit (đó là story ui-kit thường — AGENTS.md Phần II là nguồn quy tắc).
---

# use-ui-kit — dùng ĐÚNG @wakii/ui-kit

## Overview

Directives if-then cho AI tiêu THỤ ui-kit. Nguồn sự thật: `app/ui-kit/src/ui/` (115 component dirs) · `app/ui-kit/src/templates/` (template stories: auth · crud · dashboard · kanban-project · landing · parallax-landing · settings) · [app/ui-kit/USAGE.md](../../../app/ui-kit/USAGE.md) · quy tắc cứng [AGENTS.md Phần II](../../../AGENTS.md). Code mẫu copy-chạy: [docs/ai/recipes.md](../../../docs/ai/recipes.md).

## 1. Component-map theo tác vụ

IF cần X THEN dùng component + props + đối chiếu story id THẬT (ids lấy từ `app/ui-kit/storybook-static/index.json`, 966 entries; quy tắc id: `<section>-<component>--<story>`, file story tại `src/ui/<dir>/<name>.stories.tsx`):

| Muốn | Component | Props mấu chốt | Story tham chiếu |
|---|---|---|---|
| Nút + variant/loading | `Button` | `variant`, `loading`, `block` | `primitives-button--basic` |
| Bảng CRUD sort/filter/paginate | `Table` | `columns` (`sortable`/`filterable`/`render`), `virtual` | `data-display-table--column-resize` |
| Input cơ bản + affix | `Input` (+`Input.Search`) | `invalid`, `prefix`/`suffix` | `forms-input--affix` |
| Chọn 1 trong nhiều | `Select` / `CascadeSelect` (cây) | `options`, controlled `value` | `forms-cascadeselect--basic` |
| Chọn ngày/giờ | `DatePicker` | `range`, `showTime`, `locale` | `forms-datepicker--basic` |
| Dialog chặn | `Modal` | `open`, `onOk`/`onCancel`, `danger`, `confirmLoading` | `feedback-modal--basic` |
| Toast ngắn | `message` (static API) | `message.success\|error(content)` | `feedback-message--custom-styled` |
| Tabs đổi panel | `Tabs` / `Segmented` (không cần panel) | `items`, controlled `activeKey` | `navigation-tabs--controlled` |
| Sidebar app | `Sidebar` + `Menu` | `collapsed`, items đa cấp | `navigation-sidebar--basic` |
| KPI số lớn | `Statistic` | `value`, `prefix`/`suffix`, `valueStyle` | `data-display-statistic--basic` |
| Biểu đồ | `Chart` (subpath!) | `config` (chart.js), `fallback` | `data-display-chart--bar` |
| Màn hoàn chỉnh | templates | — | `templates-crud-table--full-demo` |

IF không tìm thấy ở bảng THEN tra `USAGE.md` (phần "Tham chiếu theo component") hoặc grep story id trong `storybook-static/index.json` — KHÔNG bịa id.

## 2. Tokens rules

- IF cần màu THEN CHỈ token từ `src/styles/tokens.css`: `--c-canvas`, `--c-s1/s2/s3` (bề mặt) · `--ink/--ink2/--ink3/--ink4` (mực) · `--line/--line2` (viền) · `--accent/--accent-hi` · trạng thái `--st-done/doing/fail` — qua utility có sẵn (`bg-s1`, `text-ink2`, `border-line`, `text-accent`). Cấm hex/`rgba()`/arbitrary value; cần biến thể → opacity token (`bg-accent/10`).
- IF cần z-index THEN chỉ `z-[var(--z-dropdown|popover|modal|toast|tooltip)]` — cấm số cứng.
- IF radius/shadow/motion THEN token: `rounded-lg/xl/pill` · `var(--shadow-pop|lift)` · 150–200ms + `var(--ease-enter|exit)`.
- IF dark mode THEN KHÔNG code riêng cho dark — `UiKitProvider theme="dark"` (hoặc attr `data-bp-theme="dark"` trên tổ tiên); host import `@wakii/ui-kit/styles/themes/dark.css` ĐÚNG 1 LẦN (token tự cascade).
- IF nghĩ cần token mới THEN KHÔNG tự thêm — flag lên coordinator (tokens.css: "KHÔNG tự chế token mới").

## 3. Customize pass

- IF cần edit DOM class THEN dùng prop `classNames` slots (antd v5-style) — mỗi component có `root` + sub-part (`Input`: `input`/`prefix`/`suffix`; `Card`: `header`/`body`…) + `style` passthrough. Type `<Comp>ClassNames` import từ barrel.
- IF viết component dùng prop `classNames` THEN KHÔNG destruct thẳng (`{classNames}`) khi file import helper `classnames` — shadow gây TypeError runtime (gotcha đã fix #149) → dùng `props.classNames`.
- IF muốn gộp/đè class THEN viết TƯỜNG MINH từng biến thể — KHÔNG tailwind-merge, KHÔNG string-surgery điều kiện (dễ mâu thuẫn utility; anti-pattern Phần II).

## 4. Subpath imports

- IF import component nặng THEN đúng subpath theo `exports` trong package.json — KHÔNG có ở barrel chính: `@wakii/ui-kit/carousel` · `/chart` · `/schedule` · `/editor` · `/experience3d`. Types tương ứng vẫn export type-only từ barrel.
- IF dùng subpath THEN tự cài peer-dep: `swiper` (carousel) · `chart.js` (chart) · `@fullcalendar/*` (schedule) · `@tiptap/*` (editor) — mỗi subpath nhận prop `fallback` khi peer thiếu.

## 5. a11y bắt buộc

- IF icon-only button THEN `aria-label`. IF menu THEN `role=menu/menuitem` + `aria-expanded`. IF selected THEN `aria-current`. IF switch THEN `role="switch"` + `aria-checked`. IF icon trang trí THEN `aria-hidden`.
- IF focus THEN `focus-visible:ring-2 focus-visible:ring-accent/40` — KHÔNG ring-offset, KHÔNG `outline-2` lệch chuẩn.
- IF Spinner THEN `label` bắt buộc (aria-label); IF modal/drawer THEN focus trap + scroll lock có sẵn — đừng tự làm lại.

## 6. Pitfalls

- IF FE có react-query THEN QueryClient DUY NHẤT ở host (`app/shell/src/App.tsx`, module-level); remote in-shell KHÔNG tự tạo (cache tách = tạo task mà feed không thấy); rspack share `@tanstack/react-query` đối xứng shell↔remote.
- IF motion/reveal THEN không tự animate ngoài token — `prefers-reduced-motion` tự tắt nhờ block global; `Parallax`/`Reveal` tự safety qua `useMediaQuery` — đừng wrap kép.
- IF viết test component THEN jsdom thiếu `matchMedia` — stub no-op đã có sẵn `app/ui-kit/tests/setup.ts`; thiếu `IntersectionObserver` — component tự fallback, test cần IO thì mock như `MockIO` trong `src/ui/reveal/reveal.test.tsx`; KHÔNG giả định browser API có sẵn trong jsdom.
- IF story file mới THEN phải có ≥1 `export const` story (indexer drop nếu 0); KHÔNG gắn `component:` vào meta khi story chỉ có `render` và component có required props (TS2322 chặn push — anti-pattern Phần II).
