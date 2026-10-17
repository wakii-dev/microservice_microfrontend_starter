# @wakii/ui-kit — design system (tokens + base + primitives)

Design system của boilerplate: **tokens.css** (màu/spacing/radius — CSS custom props),
**base.css** (reset + global `bp-*` primitives css) và **4 primitives**:
`Badge` · `EmptyState` · `Skeleton` · `Spinner` (React, qua source).

Tách khỏi `@wakii/fe-shared` 2026-10-17 — **ADR-0009**: design system ≠ logic;
SF design-system làm việc ở đây mà không đụng vùng READ-LOCKED của fe-shared.

## Nguyên tắc

- **Consumed QUA SOURCE**: `main`/`types` trỏ thẳng `src/` — không build, không dist.
- **KHÔNG runtime dependency** — react types do consumer cung cấp (tsconfig paths /
  resolve.modules của consumer; `react` trong devDependencies chỉ phục vụ test + storybook).
- Tokens/base **idempotent**: import nhiều lần (shell + standalone remote) cùng giá trị, vô hại.
- Primitives consume class `bp-*` từ base.css — KHÔNG tự bịa màu/spacing ngoài tokens.

## Sử dụng

```tsx
import { Badge, EmptyState, Skeleton, Spinner } from '@wakii/ui-kit';
import '@wakii/ui-kit/styles/tokens.css'; // :root custom props — shell import global, standalone tự import
import '@wakii/ui-kit/styles/base.css';   // CHỈ shell (host) — remote standalone import kèm
```

## Storybook (docs sống)

```bash
pnpm --filter @wakii/ui-kit storybook          # dev :6006 — Badge đủ variants, Tokens docs
pnpm --filter @wakii/ui-kit build-storybook    # CI gate "build được"
```

## Test

```bash
pnpm --filter @wakii/ui-kit test        # vitest + testing-library (jsdom)
pnpm --filter @wakii/ui-kit typecheck
```
