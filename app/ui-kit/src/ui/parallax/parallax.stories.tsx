// Parallax stories — scroll-linked drift against the Storybook iframe scroll.
// Scroll the preview page: cards move slower than the page at their `speed`.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parallax } from './index';

// Meta WITHOUT `component` — children is required, CSF would force args on
// render-only stories (image.stories pattern).
const meta = { title: 'Theming & Motion/Parallax', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Seeded picsum URL — deterministic real photo per seed name. */
function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/** Scroll runway so the parallax cards actually travel through the viewport. */
function Runway() {
  return (
    <>
      <div className="h-72 rounded-xl border border-dashed border-line bg-s2" />
      <div className="h-72 rounded-xl border border-dashed border-line bg-s2" />
    </>
  );
}

const HINT = 'Scroll the preview page — the card drifts slower than the page. Turn on prefers-reduced-motion and the effect switches itself off.';

/** Basic — one hero card at speed 0.3. */
export const Basic: Story = {
  name: 'Basic — hero card, speed 0.3',
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Parallax speed={0.3} className="overflow-hidden rounded-xl">
        <img
          src={photo('orca-parallax-peak', 800, 450)}
          alt="Mountain peak hero with parallax drift (picsum seed: orca-parallax-peak)"
          className="aspect-video w-full object-cover"
        />
      </Parallax>
      <p className="m-0 text-meta text-ink3">{HINT}</p>
      <Runway />
    </div>
  ),
};

/** SpeedRamp — three photos side by side, same content, different speeds. */
export const SpeedRamp: Story = {
  name: 'Speed ramp — 0.1 / 0.3 / 0.6 side by side',
  render: () => (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(
          [
            ['orca-parallax-canyon', 0.1],
            ['orca-parallax-dune', 0.3],
            ['orca-parallax-river', 0.6],
          ] as const
        ).map(([seed, speed]) => (
          <figure key={seed} className="m-0 flex flex-col gap-2">
            <Parallax speed={speed} className="overflow-hidden rounded-xl">
              <img
                src={photo(seed, 480, 320)}
                alt={`Parallax photo at speed ${speed} (picsum seed: ${seed})`}
                className="aspect-[3/2] w-full object-cover"
              />
            </Parallax>
            <figcaption className="text-center font-mono text-meta text-ink3">speed {speed}</figcaption>
          </figure>
        ))}
      </div>
      <p className="m-0 text-meta text-ink3">{HINT}</p>
      <Runway />
    </div>
  ),
};

/** WithScale — the card also zooms slightly while drifting (hero banner use). */
export const WithScale: Story = {
  name: 'With scale — drift + gentle zoom',
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Parallax speed={0.4} scale className="overflow-hidden rounded-xl">
        <img
          src={photo('orca-parallax-coast', 800, 450)}
          alt="Coastal cliff with parallax drift and zoom (picsum seed: orca-parallax-coast)"
          className="aspect-video w-full object-cover"
        />
      </Parallax>
      <p className="m-0 text-meta text-ink3">{HINT}</p>
      <Runway />
    </div>
  ),
};

/** Disabled — same setup with the effect off (also what reduced-motion sees). */
export const Disabled: Story = {
  name: 'Disabled — static card (reduced-motion fallback)',
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Parallax speed={0.3} disabled className="overflow-hidden rounded-xl">
        <img
          src={photo('orca-parallax-forest', 800, 450)}
          alt="Forest canopy, parallax disabled (picsum seed: orca-parallax-forest)"
          className="aspect-video w-full object-cover"
        />
      </Parallax>
      <p className="m-0 text-meta text-ink3">
        <strong className="text-ink">disabled</strong> renders the children untouched — this is exactly what users with{' '}
        <strong className="text-ink">prefers-reduced-motion</strong> get automatically.
      </p>
      <Runway />
    </div>
  ),
};
