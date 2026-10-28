# ui-kit MUI-parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 5 MUI-parity gaps in `@wakii/ui-kit` (Textarea autoSize, ButtonGroup, ImageList standard+masonry, standalone Portal, Progress type=circle) and ship as 0.8.0.

**Architecture:** All additive — 2 props widened on existing components, 3 new component dirs. Each task = TDD (failing behavioral tests → implement → green) + story matrix + barrel export, one atomic commit. Docs/version chores land last. Workers share one worktree (`/Users/hoivu/orca/workspaces/architecture-overview/uikit-mui-parity`, branch `wakii-dev/feat-uikit-mui-parity`) — commits serialize; max 2 workers in flight.

**Tech Stack:** React 19 + TypeScript, Tailwind v4 tokens (no hex — CSS vars only), classnames (`cx`), vitest + @testing-library/react, Storybook (`@storybook/react-vite`, `satisfies Meta` WITHOUT `component:` for render-only stories).

**Linear Issue:** VU-65 · **Spec:** `docs/superpowers/specs/2026-10-29-uikit-mui-parity-design.md`

**Repo rules that bind every task (AGENTS.md Part II):** tokens-only colors · focus `focus-visible:ring-2 focus-visible:ring-accent/40` · control heights h-8/9/10 · radius `rounded-lg` controls / `rounded-xl` cards · motion 150–200ms + `motion-reduce` · icons only via `<Icon>` · a11y minimums (aria-label on icon-only, role=group/menu, aria-current) · every story file ≥1 `export const` · comments in English.

**Test command (per package):** `pnpm --filter ui-kit test` · typecheck `pnpm --filter ui-kit typecheck` · from worktree root: `bash scripts/verify-quick.sh --json`.

---

### Task 1: Textarea `autoSize` (P0)

**Files:**
- Create: `app/ui-kit/src/ui/input/autosize.ts`
- Modify: `app/ui-kit/src/ui/input/index.tsx` (TextareaProps + wiring)
- Test: `app/ui-kit/src/ui/input/input.test.tsx` (new describe blocks)
- Modify: `app/ui-kit/src/ui/input/input.stories.tsx`, `app/ui-kit/src/index.ts`

- [ ] **Step 1: Write the failing tests** — append to `input.test.tsx`:

```tsx
// --- autoSize (pure math) ---
import { computeAutoSizeHeight, resolveAutoSize } from './autosize.js';

describe('resolveAutoSize', () => {
  it('true → {minRows: 2} (unbounded)', () => {
    expect(resolveAutoSize(true)).toEqual({ minRows: 2 });
  });
  it('object passes through', () => {
    expect(resolveAutoSize({ minRows: 3, maxRows: 6 })).toEqual({ minRows: 3, maxRows: 6 });
  });
});

describe('computeAutoSizeHeight', () => {
  const base = { lineHeight: 22, paddingY: 24, scrollHeight: 0 };
  it('grows to natural rows (ceil), respects minRows floor', () => {
    // content = 200 - 24 = 176 → 8 rows → minRows 3 no-op
    expect(computeAutoSizeHeight({ ...base, scrollHeight: 200, minRows: 3 }))
      .toEqual({ height: 8 * 22 + 24, overflowY: 'hidden' });
  });
  it('empty content floors at minRows', () => {
    expect(computeAutoSizeHeight({ ...base, scrollHeight: 10, minRows: 3 }).height).toBe(3 * 22 + 24);
  });
  it('clamps at maxRows + overflowY auto', () => {
    // content 476 → 22 rows > maxRows 4
    expect(computeAutoSizeHeight({ ...base, scrollHeight: 500, maxRows: 4 }))
      .toEqual({ height: 4 * 22 + 24, overflowY: 'auto' });
  });
  it('lineHeight<=0 falls back to 22 (jsdom)', () => {
    expect(computeAutoSizeHeight({ ...base, lineHeight: 0, scrollHeight: 46, minRows: 2 }).height).toBe(2 * 22 + 24);
  });
});

// --- autoSize (DOM wiring) ---
describe('Textarea autoSize', () => {
  it('typing grows the box; clamped box switches overflow-y', () => {
    const { container } = render(<Textarea autoSize={{ minRows: 2, maxRows: 4 }} value="" onChange={() => {}} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    // jsdom: no layout — stub metrics on the live element, then re-type to trigger the effect
    let scroll = 500;
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => scroll });
    const csSpy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '22px', paddingTop: '12px', paddingBottom: '12px',
    } as CSSStyleDeclaration);
    fireEvent.change(ta, { target: { value: 'line\n'.repeat(30) } });
    expect(ta.style.height).toBe(`${4 * 22 + 24}px`);   // clamped at maxRows 4
    expect(ta.style.overflowY).toBe('auto');
    scroll = 46;                                          // shrink content
    fireEvent.change(ta, { target: { value: 'ab' } });
    expect(ta.style.height).toBe(`${2 * 22 + 24}px`);   // floor minRows 2
    expect(ta.style.overflowY).toBe('hidden');
    csSpy.mockRestore();
  });
  it('no autoSize → height untouched (default path identical)', () => {
    const { container } = render(<Textarea value="x" onChange={() => {}} rows={3} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.style.height).toBe('');
    expect(ta).toHaveAttribute('rows', '3');
  });
});
```

Add `fireEvent` + `vi` to the existing vitest import line if missing.

- [ ] **Step 2: Run to verify RED**

Run: `pnpm --filter ui-kit test -- src/ui/input/input.test.tsx`
Expected: FAIL — `Failed to resolve import "./autosize.js"`.

- [ ] **Step 3: Implement** — create `app/ui-kit/src/ui/input/autosize.ts`:

```ts
// Textarea autoSize math — pure functions so the clamp logic is testable without layout.
// antd semantics: autoSize=true grows unbounded from 2 rows; {minRows,maxRows} clamps.
export type AutoSize = boolean | { minRows?: number; maxRows?: number };

export function resolveAutoSize(autoSize: AutoSize): { minRows?: number; maxRows?: number } {
  if (autoSize === true) return { minRows: 2 };
  return autoSize;
}

export function computeAutoSizeHeight(args: {
  scrollHeight: number;
  lineHeight: number;
  paddingY: number;
  minRows?: number;
  maxRows?: number;
}): { height: number; overflowY: 'hidden' | 'auto' } {
  const lh = args.lineHeight > 0 ? args.lineHeight : 22; // jsdom returns 0
  const content = Math.max(args.scrollHeight - args.paddingY, lh);
  const naturalRows = Math.ceil(content / lh);
  let rows = naturalRows;
  if (args.minRows !== undefined) rows = Math.max(rows, args.minRows);
  if (args.maxRows !== undefined) rows = Math.min(rows, args.maxRows);
  return {
    height: rows * lh + args.paddingY,
    overflowY: args.maxRows !== undefined && naturalRows > args.maxRows ? 'auto' : 'hidden',
  };
}
```

Wire into `Textarea` in `index.tsx`:

```tsx
// new imports
import { useLayoutEffect, useRef } from 'react'; // merge with existing react imports
import { computeAutoSizeHeight, resolveAutoSize, type AutoSize } from './autosize.js';

// TextareaProps: add
  /** antd autoSize — true = grow unbounded from 2 rows; {minRows,maxRows} clamps. */
  autoSize?: AutoSize;

// inside Textarea(): after destructuring props add
  const taRef = useRef<HTMLTextAreaElement>(null);
  const auto = autoSize ? resolveAutoSize(autoSize) : null;
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el || !auto) return;
    const cs = window.getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight) || 0;
    const paddingY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    el.style.height = 'auto';
    const { height, overflowY } = computeAutoSizeHeight({
      scrollHeight: el.scrollHeight,
      lineHeight,
      paddingY,
      minRows: auto.minRows,
      maxRows: auto.maxRows,
    });
    el.style.height = `${height}px`;
    el.style.overflowY = overflowY;
  }); // run every render — value changes must re-measure (cheap, antd-equivalent)
```

Attach `ref={taRef}` to the `<textarea>` element and add `autoSize` to the destructure. When `autoSize` is set, drop the `py-2` fixed feel is UNCHANGED — do not touch existing classes (default path identical).

- [ ] **Step 4: Run to verify GREEN** — `pnpm --filter ui-kit test -- src/ui/input/input.test.tsx` → PASS (new + all existing Textarea tests).

- [ ] **Step 5: Stories** — append to `input.stories.tsx` (match its existing title/meta):

```tsx
export const TextareaAutoSize: Story = {
  name: 'Textarea — autoSize boolean (unbounded from 2 rows)',
  render: () => <TextareaDemoAutoSize mode="boolean" />,
};
export const TextareaAutoSizeClamp: Story = {
  name: 'Textarea — autoSize {minRows:2, maxRows:5} + showCount',
  render: () => <TextareaDemoAutoSize mode="clamp" />,
};
```

with a small local demo component (uncontrolled + onChange state) defined above the stories: boolean mode → `autoSize`, clamp mode → `autoSize={{ minRows: 2, maxRows: 5 }} maxLength={200} showCount`. Type a paragraph to watch it grow; at maxRows it scrolls.

- [ ] **Step 6: Barrel** — `src/index.ts` input line: add `type AutoSize` to the type export list from `'./ui/input/index.js'` (re-export it there first: `export type { AutoSize } from './autosize.js';`).

- [ ] **Step 7: Commit**

```bash
git add app/ui-kit/src/ui/input/ app/ui-kit/src/index.ts
git commit -m "feat(ui-kit): Textarea autoSize — antd-parity JS measure, row clamp (VU-65)"
```

---

### Task 2: ButtonGroup (P1)

**Files:**
- Create: `app/ui-kit/src/ui/button/group-context.ts`, `app/ui-kit/src/ui/button/group.tsx`
- Modify: `app/ui-kit/src/ui/button/index.tsx` (context consume), `app/ui-kit/src/index.ts`
- Test: `app/ui-kit/src/ui/button/group.test.tsx` · Stories: `app/ui-kit/src/ui/button/group.stories.tsx`

- [ ] **Step 1: Failing tests** — `group.test.tsx`:

```tsx
// ButtonGroup — joined chrome, size/type context inheritance, a11y group semantics.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './index.js';
import { ButtonGroup } from './group.js';

afterEach(cleanup);

describe('ButtonGroup', () => {
  it('role=group + aria-label', () => {
    render(<ButtonGroup ariaLabel="Actions"><Button>One</Button></ButtonGroup>);
    expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument();
  });

  it('joined chrome — first/middle/last corner classes', () => {
    const { container } = render(
      <ButtonGroup ariaLabel="x"><Button>A</Button><Button>B</Button><Button>C</Button></ButtonGroup>,
    );
    const btns = container.querySelectorAll('button');
    expect(btns[0].className).not.toContain('rounded-l-none'); // first keeps left radius
    expect(btns[1].className).toContain('rounded-l-none');
    expect(btns[1].className).toContain('rounded-r-none');
    expect(btns[2].className).not.toContain('rounded-r-none'); // last keeps right radius
  });

  it('size context — child without explicit size inherits group size', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" size="small"><Button>A</Button></ButtonGroup>);
    expect(container.querySelector('button')!.className).toContain('h-8');
  });

  it('explicit child size wins over group', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" size="small"><Button size="large">A</Button></ButtonGroup>);
    expect(container.querySelector('button')!.className).toContain('h-10');
  });

  it('type context — group primary cascades', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" type="primary"><Button>A</Button></ButtonGroup>);
    expect(container.querySelector('button')!.className).toContain('bg-accent');
  });

  it('vertical orientation switches axis classes', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" orientation="vertical"><Button>A</Button></ButtonGroup>);
    expect(container.firstElementChild!.className).toContain('flex-col');
  });
});
```

- [ ] **Step 2: Run RED** — `pnpm --filter ui-kit test -- src/ui/button/group.test.tsx` → FAIL (no `./group.js`).

- [ ] **Step 3: Implement** — `group-context.ts`:

```ts
// Shared context so ButtonGroup can push size/type defaults into child Buttons.
// Type-only import from index keeps this module runtime-cycle-free.
import { createContext, useContext } from 'react';
import type { ButtonSize, ButtonType } from './index.js';

export interface ButtonGroupContextValue {
  size?: ButtonSize;
  type?: ButtonType;
}

export const ButtonGroupContext = createContext<ButtonGroupContextValue>({});
export const useButtonGroup = () => useContext(ButtonGroupContext);
```

`group.tsx`:

```tsx
// ButtonGroup — attached row/column of Buttons (MUI ButtonGroup / antd semantics):
// joined borders (-ml-px seam), outer corners keep rounded-lg, size/type cascade via context.
import cx from 'classnames';
import { useMemo, type ReactNode } from 'react';
import { ButtonGroupContext } from './group-context.js';

export interface ButtonGroupProps {
  /** Default size for child Buttons (explicit child prop wins). */
  size?: 'small' | 'middle' | 'large';
  /** Default variant for child Buttons (explicit child prop wins). */
  type?: 'primary' | 'default' | 'text';
  orientation?: 'horizontal' | 'vertical';
  /** REQUIRED a11y — group landmark name (AGENTS.md rule 10). */
  ariaLabel: string;
  className?: string;
  children?: ReactNode;
}

const JOINS = {
  horizontal:
    '[&>button:not(:first-child)]:-ml-px [&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none',
  vertical:
    '[&>button:not(:first-child)]:-mt-px [&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none',
} as const;

export function ButtonGroup(props: ButtonGroupProps) {
  const { size, type, orientation = 'horizontal', ariaLabel, className, children } = props;
  const ctx = useMemo(() => ({ size, type }), [size, type]);
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx('inline-flex [&>button:focus-visible]:z-10', JOINS[orientation], className)}
    >
      <ButtonGroupContext.Provider value={ctx}>{children}</ButtonGroupContext.Provider>
    </div>
  );
}
```

In `button/index.tsx`: import `useButtonGroup` from `./group-context.js`; change defaults to `size = props.size ?? group?.size ?? 'middle'` and `type = props.type ?? group?.type ?? 'default'` where `const group = useButtonGroup();` is the first line of the component. Default path (no group) unchanged.

- [ ] **Step 4: Run GREEN** — all `group.test.tsx` + existing `button` tests PASS.

- [ ] **Step 5: Stories** — `group.stories.tsx`, title matches sibling Button story category (check `button.stories.tsx` `title:` and use the same prefix, e.g. `General/ButtonGroup`): `Basic` (3 buttons default), `Sizes` (s/m/l groups), `Vertical`, `PrimaryGroup` (type=primary + one danger), `WithIcons` (`<Icon name="check" />` + label).

- [ ] **Step 6: Barrel** — add `export { ButtonGroup, type ButtonGroupProps } from './ui/button/group.js';` next to the Button export.

- [ ] **Step 7: Commit**

```bash
git add app/ui-kit/src/ui/button/ app/ui-kit/src/index.ts
git commit -m "feat(ui-kit): ButtonGroup — joined chrome + size/type context (VU-65)"
```

---

### Task 3: Portal (P2)

**Files:**
- Create: `app/ui-kit/src/ui/portal/index.tsx`, `portal.test.tsx`, `portal.stories.tsx`
- Modify: `app/ui-kit/src/index.ts`

- [ ] **Step 1: Failing tests** — `portal.test.tsx`:

```tsx
// Portal — default body mount, custom container, function container, inline fallback.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Portal } from './index.js';

afterEach(cleanup);

describe('Portal', () => {
  it('children land in document.body by default', () => {
    render(<Portal><p data-testid="p">hi</p></Portal>);
    expect(document.body.querySelector('[data-testid="p"]')).not.toBeNull();
  });

  it('custom container honored', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(<Portal container={host}><span data-testid="s">x</span></Portal>);
    expect(host.querySelector('[data-testid="s"]')).not.toBeNull();
  });

  it('function container evaluated', () => {
    const host = document.createElement('div');
    const fn = vi.fn(() => host);
    render(<Portal container={fn}><span>y</span></Portal>);
    expect(fn).toHaveBeenCalled();
    expect(host.textContent).toBe('y');
  });

  it('null container → inline (no portal)', () => {
    const { container } = render(<Portal container={null as unknown as HTMLElement}><em data-testid="i">z</em></Portal>);
    expect(container.querySelector('[data-testid="i"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run RED** — FAIL (module missing).

- [ ] **Step 3: Implement** — `index.tsx`:

```tsx
// Portal — pure createPortal primitive. Container resolves: fn → result, undefined → body,
// null/no-document → inline render (SSR-safe). Modal/Drawer keep their own portals (no retrofit).
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  /** Element or getter; undefined = document.body; null = render inline. */
  container?: HTMLElement | (() => HTMLElement) | null;
  children?: ReactNode;
}

export function Portal(props: PortalProps) {
  const { container, children } = props;
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const resolved =
      typeof container === 'function' ? container() : container ?? (typeof document !== 'undefined' ? document.body : null);
    setTarget(resolved);
  }, [container]);
  if (target === null) return <>{children}</>;
  return createPortal(children, target);
}
```

- [ ] **Step 4: Run GREEN.**

- [ ] **Step 5: Stories** — `portal.stories.tsx`, title `Utils/Portal` (match neighbor category): `BodyPortal` (box + caption explaining DOM placement), `CustomContainer` (portal into an adjacent bordered panel). Assert-by-eye story; keep ≥1 export.

- [ ] **Step 6: Barrel** — `export { Portal, type PortalProps } from './ui/portal/index.js';`

- [ ] **Step 7: Commit**

```bash
git add app/ui-kit/src/ui/portal/ app/ui-kit/src/index.ts
git commit -m "feat(ui-kit): Portal — standalone createPortal primitive (VU-65)"
```

---

### Task 4: Progress `type="circle"` (P2)

**Files:**
- Modify: `app/ui-kit/src/ui/progress/index.tsx`, `progress.test.tsx`, `progress.stories.tsx`
- Modify: `app/ui-kit/src/index.ts` only if `ProgressProps` type export needs widening (it already exports the type — no barrel change expected)

- [ ] **Step 1: Failing tests** — append to `progress.test.tsx`:

```tsx
describe('Progress circle', () => {
  const R = 18, C = 2 * Math.PI * R; // size 40, stroke 4

  it('renders svg progressbar with dash math for 50%', () => {
    const { container } = render(<Progress type="circle" percent={50} />);
    const svg = container.querySelector('svg[role="progressbar"]') as SVGSVGElement;
    const arc = svg.querySelectorAll('circle')[1] as SVGCircleElement;
    expect(svg).toHaveAttribute('aria-valuenow', '50');
    expect(parseFloat(arc.getAttribute('stroke-dasharray')!)).toBeCloseTo(C, 3);
    expect(parseFloat(arc.getAttribute('stroke-dashoffset')!)).toBeCloseTo(C * 0.5, 3);
  });

  it('100% → done stroke', () => {
    const { container } = render(<Progress type="circle" percent={100} />);
    const arc = container.querySelectorAll('circle')[1];
    expect((arc as SVGElement).style.stroke).toBe('var(--st-done)');
  });

  it('exception → fail stroke', () => {
    const { container } = render(<Progress type="circle" percent={30} status="exception" />);
    expect((container.querySelectorAll('circle')[1] as SVGElement).style.stroke).toBe('var(--st-fail)');
  });

  it('indeterminate → spin class, no aria-valuenow', () => {
    const { container } = render(<Progress type="circle" indeterminate />);
    const svg = container.querySelector('svg')!;
    expect(svg.className).toContain('animate-spin');
    expect(svg).not.toHaveAttribute('aria-valuenow');
  });

  it('showInfo centers the % label', () => {
    render(<Progress type="circle" percent={40} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('line regression — default unchanged', () => {
    render(<Progress percent={42} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run RED** — circle tests FAIL (`svg` null), line regression PASSES (guard).

- [ ] **Step 3: Implement** — in `index.tsx` widen `type?: 'line' | 'circle'`, add `size?: number` (circle px, default 40) and `ariaLabel?: string`; early-branch when `type === 'circle'`:

```tsx
  if (type === 'circle') {
    const s = size ?? 40;
    const stroke = 4;
    const r = (s - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const arcLen = indeterminate ? circ * 0.25 : circ;
    const offset = indeterminate ? circ * 0.375 : circ * (1 - clamped / 100);
    return (
      <div
        className={classNames('relative inline-flex items-center justify-center', props.classNames?.root, className)}
        style={style}
      >
        <svg
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={indeterminate ? undefined : clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          width={s}
          height={s}
          viewBox={`0 0 ${s} ${s}`}
          className={classNames(indeterminate && 'animate-spin motion-reduce:animate-none', props.classNames?.track)}
        >
          <circle cx={s / 2} cy={s / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'var(--line2)' }} />
          <circle
            cx={s / 2}
            cy={s / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${s / 2} ${s / 2})`}
            className={classNames('transition-[stroke-dashoffset] duration-200', props.classNames?.bar)}
            style={{ stroke: barColor }}
          />
        </svg>
        {showInfo && !indeterminate && (
          <span className={classNames('absolute inset-0 flex items-center justify-center text-label', props.classNames?.info)}>
            {clamped}%
          </span>
        )}
      </div>
    );
  }
```

Keep the whole existing line branch untouched below. Update the file header comment (`circle bỏ backlog` → circle shipped via `type`).

- [ ] **Step 4: Run GREEN** — whole `progress.test.tsx` (old + new) PASS.

- [ ] **Step 5: Stories** — add `Circle`, `CircleStatuses` (normal/success/exception), `CircleIndeterminate`, `CircleSizes` (24/40/64), `CircleNoInfo` to `progress.stories.tsx`; update its header comment.

- [ ] **Step 6: Commit**

```bash
git add app/ui-kit/src/ui/progress/
git commit -m "feat(ui-kit): Progress type=circle — SVG dash arc, indeterminate spin (VU-65)"
```

---

### Task 5: ImageList standard + masonry (P1)

**Files:**
- Create: `app/ui-kit/src/ui/image-list/index.tsx`, `image-list.test.tsx`, `image-list.stories.tsx`
- Modify: `app/ui-kit/src/index.ts`

- [ ] **Step 1: Failing tests** — `image-list.test.tsx`:

```tsx
// ImageList — standard grid vs masonry columns, captions, keyboard activation.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageList } from './index.js';

afterEach(cleanup);

const items = [
  { src: 'https://picsum.photos/seed/a/300/200', alt: 'A' },
  { src: 'https://picsum.photos/seed/b/300/300', alt: 'B' },
  { src: 'https://picsum.photos/seed/c/300/160', alt: 'C', caption: 'Third' },
];

describe('ImageList', () => {
  it('standard — grid template with cols + rowHeight images', () => {
    const { container } = render(<ImageList items={items} cols={3} gap={8} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(container.querySelectorAll('figure')).toHaveLength(3);
    expect((container.querySelector('img') as HTMLImageElement).style.height).toBe('160px');
  });

  it('masonry — CSS column-count + break-inside-avoid', () => {
    const { container } = render(<ImageList items={items} cols={2} variant="masonry" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.columnCount).toBe('2');
    expect((container.querySelector('figure') as HTMLElement).className).toContain('break-inside-avoid');
  });

  it('alt + caption render', () => {
    const { container } = render(<ImageList items={items} />);
    const alts = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('alt'));
    expect(alts).toEqual(['A', 'B', 'C']);
    expect(container.querySelector('figcaption')!.textContent).toBe('Third');
  });

  it('keyboard Enter triggers onItemClick', () => {
    const onPick = vi.fn();
    const { container } = render(<ImageList items={items} onItemClick={onPick} />);
    const fig = container.querySelector('figure') as HTMLElement;
    fig.focus();
    fireEvent.keyDown(fig, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith(0);
  });

  it('renderItem overrides the tile', () => {
    render(<ImageList items={items} renderItem={(it) => <div key={it.alt}>{`custom-${it.alt}`}</div>} />);
    expect(screen.getByText('custom-A')).toBeInTheDocument();
  });
});
```

Add the `fireEvent`, `screen` imports to the import line if missing (render/cleanup already there).

- [ ] **Step 2: Run RED** — FAIL.

- [ ] **Step 3: Implement** — `index.tsx`:

```tsx
// ImageList — MUI-parity gallery. standard = fixed-rowHeight CSS grid (crops, tidy);
// masonry = CSS columns (MUI-identical mechanics; visual order runs top-to-bottom per
// column — documented caveat). Tiles are keyboard-activatable when onItemClick is set.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface ImageListItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageListClassNames {
  root?: string;
  item?: string;
  image?: string;
  caption?: string;
}

export interface ImageListProps {
  items: ImageListItem[];
  cols?: number;
  /** px gap both axes (grid gap / column gap). */
  gap?: number;
  variant?: 'standard' | 'masonry';
  /** Fixed tile image height (standard variant only; masonry keeps natural height). */
  rowHeight?: number;
  onItemClick?: (index: number) => void;
  renderItem?: (item: ImageListItem, index: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
  classNames?: ImageListClassNames;
}

export function ImageList(props: ImageListProps) {
  const { items, cols = 3, gap = 8, variant = 'standard', rowHeight = 160, onItemClick, renderItem, className, style } = props;
  const slots = props.classNames;
  const rootStyle: CSSProperties =
    variant === 'masonry'
      ? { columnCount: cols, columnGap: `${gap}px`, ...style }
      : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${gap}px`, ...style };

  return (
    <div
      className={classNames(variant === 'masonry' ? '' : 'grid', slots?.root, className)}
      style={rootStyle}
    >
      {items.map((item, i) =>
        renderItem ? (
          renderItem(item, i)
        ) : (
          <figure
            key={`${item.src}-${i}`}
            tabIndex={onItemClick ? 0 : undefined}
            role={onItemClick ? 'button' : undefined}
            aria-label={onItemClick ? item.caption ?? item.alt : undefined}
            onKeyDown={
              onItemClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onItemClick(i);
                    }
                  }
                : undefined
            }
            onClick={onItemClick ? () => onItemClick(i) : undefined}
            className={classNames('m-0', variant === 'masonry' && 'mb-2 break-inside-avoid', slots?.item)}
          >
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className={classNames('w-full object-cover', slots?.image)}
              style={variant === 'standard' ? { height: `${rowHeight}px` } : undefined}
            />
            {item.caption && (
              <figcaption className={classNames('mt-1 text-label text-ink2', slots?.caption)}>{item.caption}</figcaption>
            )}
          </figure>
        ),
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run GREEN.**

- [ ] **Step 5: Stories** — `image-list.stories.tsx`, title matching the Data Display category siblings (check e.g. `galleria.stories.tsx` / `card.stories.tsx` `title:` for the exact prefix). Stories: `Standard` (6 picsum items, cols 3), `Masonry` (8 mixed-ratio items, cols 3), `WithCaptions`, `MasonryTwoCols`. Meta WITHOUT `component:` (render-only, the `image.stories` pattern).

- [ ] **Step 6: Barrel** — `export { ImageList, type ImageListProps, type ImageListItem, type ImageListClassNames } from './ui/image-list/index.js';`

- [ ] **Step 7: Commit**

```bash
git add app/ui-kit/src/ui/image-list/ app/ui-kit/src/index.ts
git commit -m "feat(ui-kit): ImageList — standard grid + CSS-columns masonry (VU-65)"
```

---

### Task 6: Docs + CHANGELOG + version 0.8.0 (depends on Tasks 1–5)

**Files:**
- Modify: `AGENTS.md` (Part II tables), `docs/ai/recipes.md`, `app/ui-kit/CHANGELOG.md`, `app/ui-kit/package.json`

- [ ] **Step 1: AGENTS.md Part II** — add rows (match table style verbatim):
  - "General — P0/P1 parity additions" table: `| ButtonGroup | Attached row/column of Buttons sharing size/type — combined actions, pagination clusters | size (context cascades to children) | joined chrome (-ml-px seam, outer corners keep rounded-lg) · orientation vertical · role=group + ariaLabel REQUIRED |` and `| Portal | Pure createPortal primitive for custom overlays — mount anywhere outside the React tree | container (element | () => element; undefined = body, null = inline) | wrap custom popovers/toasts · Modal/Drawer keep internal portals (no retrofit) |`
  - Data Display table (after List): `| ImageList | Photo gallery grid — standard (fixed rowHeight, cropped) or masonry (CSS columns, natural heights) | variant masonry + cols (column-count; visual order top-to-bottom per column) | items + caption → figcaption · onItemClick → keyboard-activatable figure tiles · renderItem full tile control |`
  - Feedback table Progress row: update "Most valuable prop" cell to `percent (+ type line/circle, size px)` and note indeterminate circle spin.
  - Forms table: no Textarea row exists — leave (recipes cover it).
- [ ] **Step 2: recipes.md** — add two recipes at the end (number continues the sequence): autoSize textarea in a validated form (`Field` + `Textarea autoSize={{minRows:3,maxRows:8}} showCount maxLength`), and a masonry gallery page (`ImageList variant="masonry"` + `Lightbox`-less click handler + empty state).
- [ ] **Step 3: CHANGELOG** — new `## 0.8.0` section atop: 5 bullets (one per feature, English, component + one-line usage).
- [ ] **Step 4: version** — `app/ui-kit/package.json` `0.7.2` → `0.8.0`.
- [ ] **Step 5: Full verify**

```bash
pnpm --filter ui-kit test && pnpm --filter ui-kit typecheck
bash scripts/verify-quick.sh --json   # from worktree root — expect exit 0
```

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md docs/ai/recipes.md app/ui-kit/CHANGELOG.md app/ui-kit/package.json
git commit -m "docs(ui-kit): 0.8.0 — MUI-parity docs, recipes, changelog (VU-65)"
```

---

## Verification (Rule 0 — browser, after Task 6)

1. `pnpm --filter ui-kit storybook` → http://localhost:6006
2. ZCode opens the browser, walks EVERY new story group (Textarea autoSize ×2, ButtonGroup ×5, Portal ×2, Progress circle ×5, ImageList ×4), screenshots before/after per group, checks dark mode on one story per component (`data-bp-theme=dark` toggle), verifies keyboard Enter on an ImageList tile and tab-order through a ButtonGroup.
3. `manager-head.html` turns dirty from the badge stamp → do NOT commit it (AGENTS.md trap).

## Out of scope (follow-up missions)

npm publish 0.8.0 + starter-template `^0.7.x` pin bump + create-wakii-stack patch (0.x caret lesson) · Portal retrofit into Modal/Drawer/Tooltip/Message · quilted/woven ImageList variants · responsive `cols` breakpoints.
