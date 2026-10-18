<div align="center">

# 🎨 @wakii/ui-kit

**A production-grade React design system built AI-first — 90+ components, 17 hooks, tokens-first, dark theme.**

Benchmarked against Ant Design & PrimeReact. Ships with `AGENTS.md` + recipes so AI agents build real features correctly on day one.

[![npm](https://img.shields.io/npm/v/@wakii/ui-kit?logo=npm&label=%40wakii%2Fui-kit)](https://www.npmjs.com/package/@wakii/ui-kit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Storybook](https://img.shields.io/badge/Storybook-301%20stories-ff4785?logo=storybook&logoColor=white)](https://storybook-static-khaki-two.vercel.app)

## 🤖 Built for AI agents — not just humans

This library is **AI-consumable by design**. Every agent (Claude Code, Codex, ZCode, Cursor…) that opens this repo gets productive immediately:

| Mechanism | What it does for AI |
|---|---|
| **[`AGENTS.md`](../../AGENTS.md)** (repo root) | Auto-read by agent CLIs on session start — feature→component map, mandatory rules, anti-patterns. Zero onboarding cost. |
| **[`docs/ai/recipes.md`](../../docs/ai/recipes.md)** | 10 copy-paste recipes for real features: CRUD pages, login flows, wizards, upload pipelines, dashboards. Agent picks a recipe, renames fields, ships. |
| **Behavior tests (580+)** | Every component tested by *what it does* (clicks→callbacks, state classes, keyboard flows) — agents verify their work against the same assertions. |
| **Tokens-first + z-scale + size scale** | Hard constraints instead of conventions: one source of truth CSS vars, `--z-*` layers, `h-8/9/10`. Machine-checkable, no aesthetic guessing. |
| **Living Storybook (301+ stories, [live](https://storybook-static-khaki-two.vercel.app))** | Every state of every component rendered — ground truth for visual verification loops. |
| **Strict single-button rule & friends** | Sharp opinions (no dividers on split buttons, focus-ring standard) so agents converge on ONE correct output, not five variants. |

**Dogfooded by the multi-agent workflow itself**: this library was audited, restyled and completed by *5 coordinated AI terminals in parallel* (coordinator + workers pattern), gated by pixel-level automated verification. The AI-facing docs, checklists and recipes in this repo are the same ones those agents used.

> Practical loop that works today: agent reads `AGENTS.md` → picks recipe → implements → runs `vitest` (580 tests catch wiring mistakes) → checks Storybook for visual truth → done.

[![Tests](https://img.shields.io/badge/tests-540%20passing-brightgreen)](#-quality)
[![React](https://img.shields.io/badge/React-%E2%89%A518-61dafb?logo=react)](#)

[📖 Live Storybook](https://storybook-static-khaki-two.vercel.app) ·
[📦 npm](https://www.npmjs.com/package/@wakii/ui-kit) ·
[🏠 GitHub](https://github.com/wakii-dev/architecture-overview) ·
[📚 Full docs](./USAGE.md)

</div>

---

## ✨ Why @wakii/ui-kit

| | |
|---|---|
| 🧩 **90+ components** | From DataTable with **virtual scroll (5k+ rows)** to Upload Dropzone, TreeSelect, TimePicker, range DatePicker — the parts real apps actually need |
| 🪝 **17 battle-tested hooks** | `useForm` (zod-powered), `useDebounce`, `useClickAway`, `useFocusTrap`… every hook ships behavior tests |
| 🌗 **Dark theme, done right** | One attribute — `<html data-bp-theme="dark">`. CSS-variable cascade, no flash, no JS, no rebuild |
| 🎯 **Tokens-first** | One `tokens.css` is the single source of truth — colors, spacing, radii, shadows, even a **z-index scale**. No hardcoded hex in components |
| 🚀 **Motion with taste** | Pure-CSS keyframes (zero animation deps), respects `prefers-reduced-motion` |
| ♿ **Real a11y** | Focus trap + focus restore in Modal/Drawer, ARIA roles, full keyboard support — verified in Storybook |
| 🪶 **Smart weight** | Heavy engines (Swiper, Chart.js, Tiptap, FullCalendar) are optional peers behind subpath exports — your bundle stays lean |
| 🧪 **540 behavior tests** | We test clicks → callbacks, state classes, keyboard flows. Not smoke renders |

## 🚀 Quick start

```bash
npm install @wakii/ui-kit
```

```tsx
// one CSS file — tokens + utilities + motion, all compiled
import '@wakii/ui-kit/styles/ui-kit.css';

import { Button } from '@wakii/ui-kit';

export function App() {
  return <Button variant="primary" icon="check">Get started</Button>;
}
```

### 🌗 Dark mode in one line

```html
<html data-bp-theme="dark">
```

### 📝 Forms with zod — schema is the single source of truth

```tsx
import { z } from 'zod';
import { useForm, Field, Input } from '@wakii/ui-kit';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

const form = useForm({ schema, mode: 'onBlur' });

<Field label="Email" error={form.errors.email} required>
  <Input
    value={form.values.email}
    invalid={!!form.errors.email}
    onChange={form.handleChange('email')}
    onBlur={form.handleBlur('email')}
  />
</Field>
```

## 🧩 Component map

| Group | Components |
|---|---|
| **Layout & Navigation** | Sidebar (collapsible 200→80px) · Menu / nested Submenu · Breadcrumb · Steps · Tabs · Pagination (antd look) · TabMenu · Menubar · Dropdown · SpeedDial |
| **Data display** | DataTable (filters, selection kept across pages, **virtual scroll**) · List · Tree · TreeSelect · Descriptions · Timeline · Statistic · Avatar · AvatarGroup · Badge · Tag · Collapse · Card · Image · Galleria · Carousel (Swiper) · Chart · Calendar · DatePicker (range + time + vi/en locale) · TimePicker · Schedule |
| **Forms** | Input · Textarea · InputNumber · InputMask · InputOTP · Select · AutoComplete · CascadeSelect · Checkbox · Radio · Switch · Slider · Rate · ColorPicker · Upload + UploadDropzone (drag & drop) · Field wrapper · Editor (Tiptap) |
| **Feedback** | Alert (filled by default + outlined) · Message · Notification · Modal · Drawer · Popconfirm · Progress · Skeleton · Spinner · Result · EmptyState · BlockUI |
| **Overlay** | Tooltip · Popover · ContextMenu — all on the tokenized `--z-*` scale |
| **Icons** | `Icon` component — 40+ primeicons SVG paths, tree-shakeable |

<details>
<summary><b>17 Hooks</b></summary>

`useForm` (zod) · `useLocalStorage` · `useSessionStorage` · `useDebounce` · `useThrottle` · `useTimeout` · `useCountdown` · `useClickAway` · `useHover` · `useKeyPress` · `useMediaQuery` · `useLockBodyScroll` · `useWindowSize` · `useCopyToClipboard` · `useToggle` · `usePrevious` · `useDefault` · `useFocusTrap`

</details>

## 📦 Distribution

| Registry | Package | Audience |
|---|---|---|
| **npmjs.org** | [`@wakii/ui-kit`](https://www.npmjs.com/package/@wakii/ui-kit) | Public — no auth needed |
| **GitHub Packages** | `@wakii/ui-kit` | Org-internal — add `@wakii-dev:registry=https://npm.pkg.github.com` to `.npmrc` |

Heavy engines are **optional peer dependencies** — install them only if you use the subpath:
`@wakii/ui-kit/carousel` → `swiper` · `chart` → `chart.js` · `useForm` → `zod` · schedule → `@fullcalendar/*` · editor → `@tiptap/*`

## 🔬 Quality

- **540 behavior tests** (clicks → callbacks, state classes, keyboard flows)
- **Storybook test-runner**: 215/215 stories render-verified on every push
- Dark-mode audited across every component
- `prefers-reduced-motion` respected globally

## 📚 Documentation

- [USAGE.md](./USAGE.md) — deep dives per group (forms, icons, subpaths, z-index)
- [CHANGELOG.md](./CHANGELOG.md) / [MIGRATION.md](./MIGRATION.md) — releases & breaking changes (Alert filled, antd Pagination, subpath heavy engines)
- [parity-matrix.md](../docs/parity-matrix.md) — component-by-component benchmark vs antd/PrimeReact

<div align="center">

**MIT** © [wakii-dev](https://github.com/wakii-dev) — built with 🤖 multi-agent pair-coding

</div>
