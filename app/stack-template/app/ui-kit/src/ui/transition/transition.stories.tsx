// Transition stories — Fade/Zoom/Collapse toggles + a Reveal combo (scroll
// reveal expands a collapsible) + MATRIX 11 loại (depth contract 2026-10-19:
// mọi loại ease-smooth 200-280ms, exit = reverse enter). Toggle buttons drive
// `in` like a real consumer.
import { useState, type ComponentType, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.js';
import { Reveal } from '../reveal/index.js';
import {
  Blur,
  Bounce,
  Collapse,
  Crossfade,
  Fade,
  Flip,
  Grow,
  Rotate,
  ScaleSoft,
  Slide,
  Stagger,
  Zoom,
  type TransitionProps,
} from './index';

// Meta WITHOUT `component` — children + in are required/CSF-hostile props;
// render-only stories (image.stories pattern).
const meta = {
  title: 'Theming & Motion/Transition',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          '**11 loại × khi-nào-dùng** (depth contract — mọi loại easing `--ease-smooth` 200-280ms, exit = reverse enter):',
          '| Loại | Khi nào dùng |',
          '|---|---|',
          '| Fade | mặc định an toàn — text/hint hiện gọn |',
          '| Zoom | card/dialog pop giữa màn |',
          '| Collapse (vertical) | FAQ/accordion mở rộng chiều dọc |',
          '| Collapse (horizontal) | sidebar/mở cột chi tiết |',
          '| Slide | drawer/panel trôi từ mép (4 hướng) |',
          '| Grow | menu/popover MỌC từ trigger (origin) |',
          '| Flip | đổi mặt thẻ/lượt xem 3D |',
          '| Rotate | icon/badge quay vào chỗ |',
          '| Blur | hero/ảnh focus-in từ mờ |',
          '| Bounce | điểm thưởng/success pop overshoot |',
          '| ScaleSoft | vùng nội dung hiện cực nhẹ |',
          '| Stagger | list/grid mount nối tiếp 24-40ms |',
          '| Crossfade | swap 2 trạng thái cùng chỗ |',
        ].join('\n'),
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Fade — opacity in/out, unmounts after the exit animation. */
export const FadeStory: Story = {
  name: 'Fade — opacity enter/exit',
  render: () => <ToggleDemo Comp={Fade} label="Fade" />,
};

/** Zoom — scale 96%→100% pop, modal-card feel. */
export const ZoomStory: Story = {
  name: 'Zoom — scale pop',
  render: () => <ToggleDemo Comp={Zoom} label="Zoom" />,
};

/** Collapse — height 0fr↔1fr (grid rows), FAQ-section pattern. */
export const CollapseStory: Story = {
  name: 'Collapse — height 0fr↔1fr',
  render: () => <CollapseDemo />,
};

/** WithReveal — Reveal scrolls the card in, Collapse expands details on click. */
export const WithReveal: Story = {
  name: 'With Reveal — scroll-in card with collapsible details',
  render: () => <RevealComboDemo />,
};

/** KeepMounted — unmountOnExit=false: exit plays, DOM stays (opacity-0 hold). */
export const KeepMounted: Story = {
  name: 'Keep mounted — unmountOnExit=false',
  render: () => <ToggleDemo Comp={Fade} label="Fade" unmountOnExit={false} />,
};

/** Matrix — lưới 11 loại transition (depth contract 2026-10-19): bấm nút từng ô
 * để xem enter/exit (exit = reverse enter); bảng "loại × khi-nào-dùng" ở docs
 * component trên. Mọi ô easing --ease-smooth 240ms. */
export const Matrix: Story = {
  name: 'Matrix — 11 loại (ease-smooth, exit = reverse)',
  render: () => <MatrixDemo />,
};

type GenericComp = ComponentType<Record<string, unknown>>;

const MATRIX: [string, GenericComp, Record<string, unknown>][] = [
  ['Fade', Fade as unknown as GenericComp, {}],
  ['Zoom', Zoom as unknown as GenericComp, {}],
  ['Slide up', Slide as unknown as GenericComp, { direction: 'up' }],
  ['Slide left', Slide as unknown as GenericComp, { direction: 'left' }],
  ['Grow', Grow as unknown as GenericComp, { origin: 'bottom left' }],
  ['Flip', Flip as unknown as GenericComp, {}],
  ['Rotate', Rotate as unknown as GenericComp, {}],
  ['Blur', Blur as unknown as GenericComp, {}],
  ['Bounce', Bounce as unknown as GenericComp, {}],
  ['ScaleSoft', ScaleSoft as unknown as GenericComp, {}],
];

function MatrixCell({ label, Comp, props }: { label: string; Comp: GenericComp; props: Record<string, unknown> }) {
  const [show, setShow] = useState(true);
  return (
    <div className="flex min-h-28 flex-col items-start gap-2">
      <Button size="small" onClick={() => setShow((s) => !s)}>
        {show ? 'Ẩn' : 'Hiện'} — {label}
      </Button>
      <Comp in={show} {...props}>
        <div className="rounded-xl border border-line bg-s1 p-3 text-meta text-ink2 shadow-[var(--ele-1)]">
          {label}
        </div>
      </Comp>
    </div>
  );
}

function CollapseHorizontalCell() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex min-h-28 flex-col items-start gap-2">
      <Button size="small" onClick={() => setOpen((o) => !o)}>
        Collapse ngang
      </Button>
      <Collapse in={open} orientation="horizontal" unmountOnExit={false}>
        <div className="whitespace-nowrap rounded-xl border border-line bg-s1 p-3 text-meta text-ink2 shadow-[var(--ele-1)]">
          Cột 0fr↔1fr
        </div>
      </Collapse>
    </div>
  );
}

function StaggerCell() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex min-h-28 flex-col items-start gap-2">
      <Button size="small" onClick={() => setRun((r) => r + 1)}>
        Stagger replay
      </Button>
      <Stagger key={run} in staggerMs={30}>
        <div className="rounded-lg border border-line bg-s1 px-3 py-1 text-meta text-ink2">Mục 1</div>
        <div className="rounded-lg border border-line bg-s1 px-3 py-1 text-meta text-ink2">Mục 2</div>
        <div className="rounded-lg border border-line bg-s1 px-3 py-1 text-meta text-ink2">Mục 3</div>
      </Stagger>
    </div>
  );
}

function CrossfadeCell() {
  const [face, setFace] = useState<0 | 1>(0);
  return (
    <div className="flex min-h-28 flex-col items-start gap-2">
      <Button size="small" onClick={() => setFace((f) => (f === 0 ? 1 : 0))}>
        Crossfade swap
      </Button>
      <Crossfade active={face} className="w-40">
        <div className="rounded-xl border border-line bg-s1 p-3 text-meta text-ink2 shadow-[var(--ele-1)]">Mặt A</div>
        <div className="rounded-xl border border-line bg-s1 p-3 text-meta text-ink2 shadow-[var(--ele-1)]">Mặt B</div>
      </Crossfade>
    </div>
  );
}

function MatrixDemo() {
  return (
    <div className="grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {MATRIX.map(([label, Comp, props]) => (
        <MatrixCell key={label} label={label} Comp={Comp} props={props} />
      ))}
      <CollapseHorizontalCell />
      <StaggerCell />
      <CrossfadeCell />
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="w-fit rounded-xl border border-line bg-s1 p-4 text-body text-ink2">{children}</div>;
}

function ToggleDemo({ Comp, label, unmountOnExit }: { Comp: (props: TransitionProps) => ReactNode; label: string; unmountOnExit?: boolean }) {
  const [show, setShow] = useState(true);
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Button onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'} ({label})</Button>
      <Comp in={show} unmountOnExit={unmountOnExit}>
        <Panel>
          {label} transition — exit plays to the end before unmount (motion-base, tokens only).
        </Panel>
      </Comp>
    </div>
  );
}

function CollapseDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="max-w-md rounded-xl border border-line bg-s1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3 text-left text-body font-medium text-ink hover:bg-s2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        What changes when I collapse this?
        <span className="font-mono text-meta text-ink3">{open ? '−' : '+'}</span>
      </button>
      {/* padding nằm SẶC trong tầng clip — không đặt lên wrapper Collapse */}
      <Collapse in={open}>
        <p className="m-0 px-4 pb-4 text-body text-ink2">
          Grid rows animate 0fr↔1fr so the height eases without measuring — padding lives inside the
          clipped tier, never on the wrapper.
        </p>
      </Collapse>
    </div>
  );
}

function RevealComboDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex max-w-md flex-col gap-6">
      <Reveal direction="up">
        <div className="rounded-xl border border-line bg-s1 p-4">
          <div className="text-body font-medium text-ink">Scroll-revealed card</div>
          <p className="m-0 mt-1 text-meta text-ink3">
            Reveal brought this card in; the button below drives a Collapse.
          </p>
          <div className="mt-3">
            <Button size="small" onClick={() => setOpen((o) => !o)}>
              {open ? 'Hide details' : 'Show details'}
            </Button>
          </div>
          <Collapse in={open}>
            <p className="m-0 pt-3 text-body text-ink2">
              Two motion primitives stacked: Reveal owns the scroll entrance, Collapse owns the expand
              state — each unmount/exit cleans up after itself.
            </p>
          </Collapse>
        </div>
      </Reveal>
    </div>
  );
}
