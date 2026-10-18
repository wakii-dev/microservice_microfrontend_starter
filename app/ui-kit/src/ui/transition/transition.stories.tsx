// Transition stories — Fade/Zoom/Collapse toggles + a Reveal combo (scroll
// reveal expands a collapsible). Toggle buttons drive `in` like a real consumer.
import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.js';
import { Reveal } from '../reveal/index.js';
import { Collapse, Fade, Zoom, type TransitionProps } from './index';

// Meta WITHOUT `component` — children + in are required/CSF-hostile props;
// render-only stories (image.stories pattern).
const meta = { title: 'Theming & Motion/Transition', tags: ['autodocs'] } satisfies Meta;
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
