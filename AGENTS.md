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
