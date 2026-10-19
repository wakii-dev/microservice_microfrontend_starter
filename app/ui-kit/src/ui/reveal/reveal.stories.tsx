// Reveal stories — blocks animate in when they enter the viewport. In the
// Storybook iframe the first blocks are usually already visible (they animate
// on load); scroll to the lower blocks to watch the enter transitions.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Reveal, type RevealDirection } from './index';

// Meta WITHOUT `component` — children is required, CSF would force args on
// render-only stories (image.stories pattern).
const meta = { title: 'Theming & Motion/Reveal', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-line bg-s1 p-4">
      <div className="text-body font-medium text-ink">{title}</div>
      <div className="mt-1 text-meta text-ink3">{body}</div>
    </div>
  );
}

/** Basic — three panels sliding up as they enter the viewport. */
export const Basic: Story = {
  name: 'Basic — slide up on enter',
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      <Reveal>
        <Panel title="First block" body="Reveals as soon as it enters the viewport." />
      </Reveal>
      <Reveal>
        <Panel title="Second block" body="Each Reveal observes itself independently." />
      </Reveal>
      <Reveal>
        <Panel title="Third block" body="Scroll down and back up — once=true keeps it visible." />
      </Reveal>
      <div className="h-72 rounded-xl border border-dashed border-line bg-s2" />
    </div>
  ),
};

/** Directions — the four enter directions side by side. */
export const Directions: Story = {
  name: 'Directions — up / down / left / right',
  render: () => (
    <div className="grid max-w-xl grid-cols-2 gap-4">
      {(
        [
          ['up', 'Drifts in from below'],
          ['down', 'Drops in from above'],
          ['left', 'Enters from the left edge'],
          ['right', 'Enters from the right edge'],
        ] as [RevealDirection, string][]
      ).map(([dir, body]) => (
        <Reveal key={dir} direction={dir}>
          <Panel title={`direction: ${dir}`} body={body} />
        </Reveal>
      ))}
    </div>
  ),
};

/** Stagger — same direction, increasing delay for a cascade. */
export const Stagger: Story = {
  name: 'Stagger — delay 0 / 150 / 300 ms',
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      {([0, 150, 300] as const).map((delay) => (
        <Reveal key={delay} delay={delay}>
          <Panel title={`delay: ${delay} ms`} body="Blocks land one after another." />
        </Reveal>
      ))}
    </div>
  ),
};

/** Repeat — once=false re-hides when the block leaves the viewport. */
export const Repeat: Story = {
  name: 'Repeat — once=false re-plays on every enter',
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      <Reveal once={false}>
        <Panel
          title="once={false}"
          body="Scroll this block out of view, then back — it hides and replays each time (once=true, the default, plays only once)."
        />
      </Reveal>
      <div className="h-72 rounded-xl border border-dashed border-line bg-s2" />
      <div className="h-72 rounded-xl border border-dashed border-line bg-s2" />
    </div>
  ),
};
