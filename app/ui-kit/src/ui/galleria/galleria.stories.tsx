// Galleria stories — real photography via picsum.photos (seeded URLs: stable
// across loads, no auth, plain-CORS <img> safe) — same pattern as image.stories.
// Scroll-snap swipe + dot indicators; every photo carries a descriptive caption.
// Tests stay offline (galleria.test.tsx uses local paths — network-free).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Galleria, type GalleriaImage } from './index';

// Meta WITH component — every story carries args (component has a required
// `images` prop, so render-only stories here would fail CSF typecheck).
const meta = { title: 'Data Display/Galleria', component: Galleria, tags: ['autodocs'] } satisfies Meta<typeof Galleria>;
export default meta;
type S = StoryObj<typeof meta>;

/** Seeded picsum URL — deterministic real photo per seed name. */
function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const TRIP: GalleriaImage[] = [
  {
    src: photo('orca-ridge', 1280, 720),
    alt: 'Mountain ridge above the tree line (picsum seed: orca-ridge)',
    caption: 'Day 1 — ridge trail, thin air and a clear sky',
  },
  {
    src: photo('orca-bay', 1280, 720),
    alt: 'Bay at sunset with boats at anchor (picsum seed: orca-bay)',
    caption: 'Day 2 — the bay calms down at golden hour',
  },
  {
    src: photo('orca-dune', 1280, 720),
    alt: 'Sand dunes with wind-carved ripples (picsum seed: orca-dune)',
    caption: 'Day 3 — dunes reshape themselves overnight',
  },
  {
    src: photo('orca-lake', 1280, 720),
    alt: 'Alpine lake reflecting the valley walls (picsum seed: orca-lake)',
    caption: 'Day 4 — still water, best photo stop of the trip',
  },
];

/** Basic — 4 real photos, swipe/scroll or click the dots; each has a caption. */
export const Basic: S = {
  name: 'Basic — real photos with trip captions',
  args: { images: TRIP, className: 'max-w-2xl' },
};

/** WithoutCaptions — same set, no caption paragraph (cleaner media strip). */
export const WithoutCaptions: S = {
  name: 'Without captions — media strip only',
  args: { images: TRIP.map(({ src, alt }) => ({ src, alt })), className: 'max-w-2xl' },
};

/** SingleImage — one photo, one dot (single indicator). */
export const SingleImage: S = {
  name: 'Single — one photo (single dot indicator)',
  args: {
    images: [
      {
        src: photo('orca-meadow', 1280, 720),
        alt: 'Wildflower meadow under a wide sky (picsum seed: orca-meadow)',
        caption: 'A single slide — one dot, no swipe needed',
      },
    ],
    className: 'max-w-2xl',
  },
};

/** DarkTheme — real photos on the dark canvas (tokens cascade). */
export const DarkTheme: S = {
  name: 'Dark theme',
  args: { images: TRIP.slice(0, 3), className: 'max-w-2xl' },
  render: (args) => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <Galleria {...args} />
    </div>
  ),
};
