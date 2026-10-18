# Migration — @wakii-dev/ui-kit

Các breaking/behavior change giữa 2 lần merge, và cách giữ hành vi cũ khi cần.
Xem [CHANGELOG.md](./CHANGELOG.md) cho danh sách đầy đủ.

## 1. Alert — `filled` là mặc định (2026-10-18)

`Alert` giờ render **nền đặc màu type + chữ trắng, không viền** (WCAG AA với màu đậm đã chọn).
Look cũ (tint bg + viền + chữ màu) không mất — chuyển sang `variant="outlined"`.

```tsx
// TRƯỚC (look cũ trở thành mặc định)
<Alert type="error" message="Gán thất bại" />

// SAU — mặc định filled (nền đặc, chữ trắng)
<Alert type="error" message="Gán thất bại" />

// GIỮ look cũ
<Alert type="error" message="Gán thất bại" variant="outlined" />
```

**Ảnh hưởng**: `remotes/tasks` + `remotes/activity` đang hiển thị banner lỗi/thành công —
đã verify test xanh sau đổi; UI banner chuyển sang filled là chủ đích design (khối lượng
chữ trắng nổi hơn trên mọi surface). API props khác (`message/description/closable/onClose`)
giữ nguyên.

## 2. Pagination — antd look (viền + radius + icon)

Item đổi khối class — nếu consumer có CSS/selector bám class cũ cần đối chiếu:

| Trạng thái | Trước | Sau |
|---|---|---|
| Item thường | `rounded-2 border border-transparent` | `rounded-lg border border-line bg-transparent` |
| Active | `rounded-[4px] border-none bg-accent` | `rounded-lg border-none bg-accent text-white font-medium` (hover giữ accent) |
| Prev/Next | ký tự `‹ ›` | SVG chevron (`<Icon name="chevron-left/right" size={14}/>`), disabled = `text-ink3 cursor-not-allowed` không viền |
| Ellipsis | `•••` | `···` (middot) — **text content đổi**, selector theo text phải sửa |

API props, `pageList` logic, `aria-label`/`aria-current` **giữ nguyên**.

## 3. Imports nặng — chuyển subpath

CSS của component nặng đã **tách khỏi barrel chính** để barrel không kéo CSS/Swiper khi
chỉ dùng primitive. Consumer đang import carousel/chart/schedule/editor từ barrel cần chuyển:

```tsx
// TRƯỚC — kéo cả swiper CSS qua barrel
import { Carousel } from '@wakii-dev/ui-kit';

// SAU — subpath (component + CSS gói cùng nhau)
import { Carousel } from '@wakii-dev/ui-kit/carousel';
import { Chart } from '@wakii-dev/ui-kit/chart';
import { Schedule } from '@wakii-dev/ui-kit/schedule';
import { Editor } from '@wakii-dev/ui-kit/editor';
```

Yêu cầu đi kèm: `swiper` là **peer-dep của subpath carousel** — consumer tự cài
(`pnpm add swiper`) đúng pattern `zod` với `useForm`. Shell/remotes đã chuyển hết;
story file demo tự import `'swiper/css'` để canvas Storybook có style.

## 4. Z-index — dùng scale token, không hardcode

Sistema tầng mới (thấp → cao): `--z-dropdown:1000 < --z-popover:1030 < --z-modal:1050
< --z-toast:1070 < --z-tooltip:1090`.

```tsx
// TRƯỚC — số cứng, dễ xung đột tầng
<div className="absolute z-50">…</div>

// SAU — token theo tier
<div className="absolute z-[var(--z-dropdown)]">…</div>
```

Nếu app consumer **override** thứ tự tầng (vd modal dưới toast), override biến ở scope
của mình — `:root { --z-toast: 1040; }` — thay vì sửa `z-*` rải rác trong component.

## 5. useForm — zod là peer-dep

`useForm` yêu cầu `zod ^4` do consumer khai báo (`pnpm add zod`). ui-kit chỉ đặt
`peerDependencies` — không bundle schema engine vào barrel.

```bash
# consumer (shell/remotes) cần có zod trước khi dùng useForm
pnpm add zod@^4
```
