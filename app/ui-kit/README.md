# @wakii/ui-kit

> Design system của Wakii — **~90 React components + 17 hooks**, tokens-first với Tailwind v4,
> dark theme, motion mượt, a11y. Benchmark antd × PrimeReact, làm hơn ở motion và modern identity.

[![npm](https://img.shields.io/npm/v/@wakii/ui-kit?label=%40wakii%2Fui-kit&logo=npm)](https://www.npmjs.com/package/@wakii/ui-kit)
[![Storybook](https://img.shields.io/badge/Storybook-301%20stories-ff4785?logo=storybook)](https://storybook-static-khaki-two.vercel.app)
[![tests](https://img.shields.io/badge/tests-540%20passing-brightgreen)](#)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

📖 **Storybook:** https://storybook-static-khaki-two.vercel.app — mọi component, props, states demo thật.
🏠 **Repo:** https://github.com/wakii-dev/architecture-overview · 📦 **GitHub Packages:** `@wakii-dev/ui-kit` (mirror nội bộ org).

---

## Cài đặt

```bash
npm i @wakii/ui-kit            # npmjs.org (public)
# hoặc GitHub Packages (org nội bộ):
#   .npmrc: @wakii-dev:registry=https://npm.pkg.github.com → npm i @wakii-dev/ui-kit
```

React ≥ 18. Heavy engines là **optional peers** — chỉ cài khi dùng subpath: `swiper` (`@wakii/ui-kit/carousel`), `chart.js` (chart), `zod` (useForm).

## Bắt đầu trong 30 giây

```tsx
import '@wakii/ui-kit/styles/ui-kit.css';   // 1 file CSS compiled (tokens + utilities + motion)

import { Button } from '@wakii/ui-kit';

function App() {
  return <Button variant="primary" icon="check">Bắt đầu</Button>;
}
```

**Dark mode** — một attribute, không reload:

```html
<html data-bp-theme="dark">
```

**Form với zod** (schema là source of truth):

```tsx
const form = useForm({ schema: z.object({ email: z.string().email('Email không hợp lệ') }), mode: 'onBlur' });
<Field label="Email" error={form.errors.email} required>
  <Input value={form.values.email} invalid={!!form.errors.email}
         onChange={form.handleChange('email')} onBlur={form.handleBlur('email')} />
</Field>
```

## Có gì trong hộp

| Nhóm | Components |
|---|---|
| **Layout & Nav** | Sidebar (collapsible 200→80px), Menu/Submenu đa cấp, Breadcrumb, Steps, Tabs, Pagination (antd look), TabMenu, Menubar, Dropdown, SpeedDial |
| **Data Display** | Table (DataTable + filter + **virtual scroll 5k+ rows**), List, Tree, TreeSelect, Descriptions, Timeline, Statistic, Avatar, AvatarGroup, Badge, Tag, Collapse, Card, Image, Galleria, Carousel (Swiper), Chart, Calendar, DatePicker (range + time + locale vi/en), TimePicker, Schedule (FullCalendar) |
| **Forms** | Input, Textarea, InputNumber, InputMask, InputOTP, Select, AutoComplete, CascadeSelect, Checkbox, Radio, Switch, Slider, Rate, ColorPicker, Upload + **UploadDropzone** (drag-drop), **Field** wrapper, Editor (Tiptap) |
| **Feedback** | Alert (filled mặc định + outlined), Message, Notification, Modal, Drawer, Popconfirm, Progress, Skeleton, Spinner, Result, EmptyState, BlockUI |
| **Overlay** | Tooltip, Popover, ContextMenu — z-index theo thang token `--z-*` |
| **Hooks (17)** | useForm (zod), useLocalStorage, useSessionStorage, useDebounce, useThrottle, useTimeout, useCountdown, useClickAway, useHover, useKeyPress, useMediaQuery, useLockBodyScroll, useWindowSize, useCopyToClipboard, useToggle, usePrevious, useDefault, useFocusTrap |
| **Icon** | `Icon` component ~40 primeicons SVG gốc, tree-shakeable |

## Nguyên tắc thiết kế

- **Tokens-first** — `tokens.css` là nguồn sự thật duy nhất (màu/spacing/radius/shadow/**z-index scale**); components không hex cứng
- **Dark theme** qua CSS var cascade (`[data-bp-theme="dark"]`) — không flash, không JS
- **Motion CSS thuần 0 deps** — keyframes identity `bp-*`, tôn trọng `prefers-reduced-motion`
- **A11y thật** — focus trap + restore (Modal/Drawer), aria chuẩn, keyboard walkthrough
- **Behavior tests** — 540 tests assert hành vi thật (click → onChange, class state, jump logic), không smoke render

## Tài liệu

- [USAGE.md](./USAGE.md) — hướng dẫn chi tiết theo nhóm (form, icon, subpath, z-index)
- [CHANGELOG.md](./CHANGELOG.md) · [MIGRATION.md](./MIGRATION.md) (Alert filled, pagination antd, subpath heavy)
- [parity-matrix.md](../docs/parity-matrix.md) — đối chiếu antd/PrimeReact từng component

MIT © wakii-dev
