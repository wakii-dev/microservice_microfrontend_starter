# @wakii-dev/ui-kit — design system (tokens + base + primitives + hooks)

📖 **Storybook (Vercel): https://storybook-static-khaki-two.vercel.app** — 301 stories toàn bộ components/hooks, dark theme, autodocs.
📦 **Packages:** [`@wakii-dev/ui-kit@0.1.2`](https://github.com/wakii-dev/architecture-overview/pkgs/package/ui-kit) — GitHub Packages (chính thức, latest). Cần `.npmrc`: `@wakii-dev:registry=https://npm.pkg.github.com` + token, rồi `npm i @wakii-dev/ui-kit`. Mirror public không cần auth: [`wakii-ui-kit`](https://www.npmjs.com/package/wakii-ui-kit) trên npmjs.org (subpath: `@wakii-dev/ui-kit/carousel`...).

Design system của boilerplate: **tokens.css** (màu/spacing/radius/shadow/z-index — CSS
custom props), **base.css** (reset + global `bp-*` primitives css), **Tailwind v4**
(`styles/tailwind.css` — `@theme inline` map thẳng tokens, utilities dùng trong toàn bộ
components), **motion** (keyframes identity `bp-*`) và bộ **React components + hooks**
(VU-53 redesign 2026-10).

Tách khỏi `@wakii/fe-shared` 2026-10-17 — **ADR-0009**: design system ≠ logic;
SF design-system làm việc ở đây mà không đụng vùng READ-LOCKED của fe-shared.

## Nguyên tắc

- **Consumed QUA SOURCE trong workspace**: `main`/`types` trỏ thẳng `src/` — monorepo
  không cần build. Khi publish npm: `publishConfig` chuyển sang `dist/` (tsup esm+cjs+dts).
- **Không runtime dependency bắt buộc** — `react`/`react-dom` là peerDeps; heavy deps
  (swiper/chart.js/fullcalendar/tiptap) là **optional peers** — chỉ pull khi dùng subpath.
- Tokens/base **idempotent**: import nhiều lần (shell + standalone remote) cùng giá trị.
- Components consume Tailwind utilities + CSS vars từ tokens — KHÔNG tự bịa màu/spacing.
- Z-index dùng thang token `z-[var(--z-*)]` (dropdown 1000 → tooltip 1090) — không hardcode số.

## Install

**Workspace (hiện tại — qua source):**

```bash
pnpm install --frozen-lockfile   # root workspace
```

```tsx
import { Button, Input, Modal, message } from '@wakii-dev/ui-kit';
import '@wakii-dev/ui-kit/styles/tokens.css';  // :root custom props — shell import global
import '@wakii-dev/ui-kit/styles/base.css';    // CHỈ shell (host) — remote standalone import kèm
import '@wakii-dev/ui-kit/styles/tailwind.css'; // Tailwind v4 utilities (app import 1 lần)
```

**npm (tương lai — sau khi publish, build dist):**

```tsx
import { Button, Field } from '@wakii-dev/ui-kit';
// Heavy components qua subpath — CSS đi kèm entry, không qua barrel chính:
import { Carousel } from '@wakii-dev/ui-kit/carousel'; // tự import 'swiper/css'
import { Chart } from '@wakii-dev/ui-kit/chart';
import { Schedule } from '@wakii-dev/ui-kit/schedule'; // peer-lazy fullcalendar
import { Editor } from '@wakii-dev/ui-kit/editor';
```

## Component groups

| Nhóm | Components |
| --- | --- |
| Primitives | `Badge` · `Tag` · `Button` · `Spinner` · `Skeleton` · `EmptyState` · `Divider` · `Typography` · `Icon` (~40 primeicons SVG) · `Card` · `Avatar` |
| Form | `Input` · `Textarea` · `Select` · `AutoComplete` · `Checkbox` · `Radio` · `Switch` · `Slider` · `Rating` · `InputNumber` · `InputOTP` · `InputMask` · `Password` · `Chips` · `Mention` · `Field` (label/error/hint — react-hook-form + zod) · `Upload` + `UploadDropzone` |
| Date/Time | `Calendar` · `DatePicker` · `Schedule` (fullcalendar peer-lazy) |
| Data Display | `Table` (DataTable + filter) · `Chart` (chart.js) · `Carousel` (swiper) · `Timeline` · `Statistic` · `Descriptions` · `Tree` · `List` · `Image` (preview) · `Editor` (tiptap) |
| Feedback | `Modal` · `Drawer` · `message` · `Notification` · `Alert` · `Progress` · `Tooltip` · `Popconfirm` · `Spinner` |
| Navigation | `Tabs` · `Breadcrumb` · `Pagination` · `Menubar` · `ContextMenu` · `PanelMenu` · `Steps` · `Toolbar` |
| Hooks (16, spec usehooks.com) | `useLocalStorage` · `useSessionStorage` · `useToggle` · `usePrevious` · `useDefault` · `useDebounce` · `useThrottle` · `useTimeout` · `useCountdown` · `useClickAway` · `useHover` · `useKeyPress` · `useMediaQuery` · `useLockBodyScroll` · `useWindowSize` · `useCopyToClipboard` |

Mỗi component có stories (Storybook `Primitives/*`, `Data Display/*`, section `Hooks`)
và test behavior colocated (`*.test.tsx`) — docs sống thay screenshot ad-hoc.

## Dark theme

```tsx
import '@wakii-dev/ui-kit/styles/themes/dark.css'; // override [data-bp-theme="dark"]
// bật: document.documentElement.setAttribute('data-bp-theme', 'dark')
```

`tokens.css` đã `@import` dark theme ở đầu file (CSS spec: `@import` sau rule bị drop —
bug 2026-10-17). Import tokens là đủ; dark.css chỉ cần khi muốn tách fichier.

## Scripts

| Lệnh | Nội dung |
| --- | --- |
| `pnpm --filter @wakii-dev/ui-kit dev` | Storybook dev :6006 |
| `pnpm --filter @wakii-dev/ui-kit test` | vitest + testing-library (jsdom) |
| `pnpm --filter @wakii-dev/ui-kit typecheck` | `tsc --noEmit` |
| `pnpm --filter @wakii-dev/ui-kit lint` | eslint flat config — legacy chỉ warn, không auto-fix |
| `pnpm --filter @wakii-dev/ui-kit build` | tsup → `dist/` (esm+cjs+dts, 5 entries) — chỉ cho npm publish |
| `pnpm --filter @wakii-dev/ui-kit build-storybook` | CI gate "build được" |
| `pnpm --filter @wakii-dev/ui-kit exec changeset status` | xem changesets pending (publish flow) |
