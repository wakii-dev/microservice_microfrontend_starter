// UiImage stories — real photography via picsum.photos (seeded URLs: stable
// across loads, no auth, plain-CORS <img> safe). Matrix: basic, aspect ratios,
// caption, click-to-zoom preview, gallery grid, error fallback, sizes, dark.
// Tests stay offline (image.test.tsx uses local paths — network-free by design).
import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index.js';
import { UiImage } from './index';

// Meta WITHOUT `component` — src/alt are required props, and CSF types then
// force `args` onto every story (render-only stories would fail typecheck).
const meta = { title: 'Data Display/Image', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Seeded picsum URL — deterministic real photo per seed name. */
function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const VALLEY = photo('orca-valley', 1280, 720);

/** Basic — a real photo with a descriptive alt (alt also names the preview dialog). */
export const Basic: Story = {
  name: 'Basic — real photo with descriptive alt',
  render: () => (
    <UiImage src={VALLEY} alt="Mountain valley landscape at dawn (picsum seed: orca-valley)" width={400} />
  ),
};

/** AspectRatios — one source framed 16:9 / 4:3 / 1:1 / 9:16 via wrapper + object-cover. */
export const AspectRatios: Story = {
  name: 'Aspect ratios — 16:9 / 4:3 / 1:1 / 9:16',
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 items-start gap-4 sm:grid-cols-4">
      {(
        [
          ['16:9', 'aspect-video', photo('orca-city', 640, 360), 'City skyline (picsum seed: orca-city)'],
          ['4:3', 'aspect-[4/3]', photo('orca-harbor', 640, 480), 'Harbor at midday (picsum seed: orca-harbor)'],
          ['1:1', 'aspect-square', photo('orca-plaza', 640, 640), 'Stone plaza square crop (picsum seed: orca-plaza)'],
          ['9:16', 'aspect-[9/16]', photo('orca-tower', 360, 640), 'Tower, tall crop (picsum seed: orca-tower)'],
        ] as const
      ).map(([ratio, aspect, src, alt]) => (
        <figure key={ratio} className="m-0 flex flex-col gap-2">
          <div className={`overflow-hidden rounded-lg ${aspect}`}>
            <UiImage src={src} alt={alt} className="h-full w-full object-cover" />
          </div>
          <figcaption className="text-center font-mono text-meta text-ink3">{ratio}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

/** WithCaption — image in a figure with a caption + supporting description line. */
export const WithCaption: Story = {
  name: 'With caption — figure + caption + description',
  render: () => (
    <figure className="m-0 flex w-fit flex-col gap-2">
      <UiImage
        src={photo('orca-coast', 960, 540)}
        alt="Rocky coastline under an overcast sky (picsum seed: orca-coast)"
        width={420}
        className="w-[420px] object-cover"
      />
      <figcaption>
        <span className="text-body font-medium text-ink">Coastal survey — site 12</span>
        <span className="mt-1 block text-meta text-ink3">
          Reference shot for the field report; click the image to open the zoom preview.
        </span>
      </figcaption>
    </figure>
  ),
};

/** PreviewZoom — high-res source (1600×900) shown small; the overlay keeps it sharp. */
export const PreviewZoom: Story = {
  name: 'Preview zoom — hi-res source stays sharp in the overlay',
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <UiImage
        src={photo('orca-gallery', 1600, 900)}
        alt="Gallery hero photo, high resolution (picsum seed: orca-gallery)"
        width={320}
      />
      <span className="text-meta text-ink3">
        Thumbnail renders at 320px from a 1600×900 source — click it: the overlay shows the full-resolution
        image, ESC or a click on the backdrop closes.
      </span>
    </div>
  ),
};

/** GalleryGrid — four real photos in a 2-col grid; each opens its own preview. */
export const GalleryGrid: Story = {
  name: 'Gallery grid — 4 real photos, click to zoom any tile',
  render: () => (
    <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      {(
        [
          ['orca-team', 600, 400, 'Team standup around a table (picsum seed: orca-team)'],
          ['orca-workshop', 600, 400, 'Engineer working at a bench (picsum seed: orca-workshop)'],
          ['orca-code', 600, 400, 'Screen with code, close-up (picsum seed: orca-code)'],
          ['orca-forest', 600, 400, 'Forest trail, natural light (picsum seed: orca-forest)'],
        ] as const
      ).map(([seed, w, h, alt]) => (
        <UiImage key={seed} src={photo(seed, w, h)} alt={alt} className="aspect-[3/2] w-full object-cover" />
      ))}
    </div>
  ),
};

/** ErrorState — broken URL degrades to a graceful placeholder, not a broken-image icon. */
export const ErrorState: Story = {
  name: 'Error state — broken URL → graceful fallback',
  render: () => <ErrorStateDemo />,
};

/** Sizes — width as px number vs CSS string percentage. */
export const Sizes: Story = {
  name: 'Sizes — width px vs percentage',
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <UiImage
        src={photo('orca-street', 480, 320)}
        alt="Street scene at 240 px wide (picsum seed: orca-street)"
        width={240}
      />
      <div className="w-64">
        <UiImage
          src={photo('orca-street', 480, 320)}
          alt="Street scene at 100% container width (picsum seed: orca-street)"
          className="w-full object-cover"
        />
      </div>
    </div>
  ),
};

/** DarkTheme — real photo on the dark canvas (tokens cascade, no per-component work). */
export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-fit rounded-xl bg-canvas p-4">
      <UiImage src={photo('orca-night', 800, 450)} alt="Night scene on dark canvas (picsum seed: orca-night)" width={360} />
    </div>
  ),
};

/**
 * ErrorState demo — UiImage has no built-in fallback, so the wrapper listens for
 * the <img> error event in the capture phase (resource errors don't bubble) and
 * swaps the image for a quiet placeholder. Copy this pattern in consumers.
 */
function ErrorStateDemo() {
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onErr = () => setFailed(true);
    el.addEventListener('error', onErr, true);
    return () => el.removeEventListener('error', onErr, true);
  }, []);

  if (failed) {
    return (
      <div
        role="status"
        className="flex h-52 w-80 flex-col items-center justify-center gap-2 rounded-lg border border-line bg-s2"
      >
        <Icon name="file" size={24} className="text-ink3" />
        <span className="px-6 text-center text-meta text-ink3">Image unavailable — check the URL or re-upload.</span>
      </div>
    );
  }
  return (
    <div ref={wrapRef}>
      <UiImage src="https://invalid.example/x.jpg" alt="Broken image URL demo" width={320} />
    </div>
  );
}

// ── Real-world usage (2026-10-25): product & editorial contexts ──

const PRODUCTS = [
  { seed: 'product-teapot', name: 'Stoneware teapot', price: '$42' },
  { seed: 'product-lamp', name: 'Brass desk lamp', price: '$88' },
  { seed: 'product-chair', name: 'Oak lounge chair', price: '$240' },
  { seed: 'product-mug', name: 'Ceramic mug set', price: '$28' },
];

/** ProductAlbum — e-commerce grid: 4 photo tiles, name + price captions, each tile zooms. */
export const ProductAlbum: Story = {
  name: 'Product album — 4-photo grid with name + price captions',
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4">
      {PRODUCTS.map((p) => (
        <figure key={p.seed} className="m-0 flex flex-col gap-2">
          <UiImage
            src={photo(p.seed, 600, 450)}
            alt={`${p.name} on a neutral background (picsum seed: ${p.seed})`}
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
          <figcaption className="flex items-baseline justify-between gap-2">
            <span className="text-body font-medium text-ink">{p.name}</span>
            <span className="font-mono text-meta text-ink2">{p.price}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

/** ArticleCover — editorial hero: full-width 1200×630 cover + figcaption credit line. */
export const ArticleCover: Story = {
  name: 'Article cover — full-width hero + figcaption credit',
  render: () => (
    <figure className="m-0 flex max-w-2xl flex-col gap-2">
      <UiImage
        src={photo('orca-article-cover', 1200, 630)}
        alt="Rolling hills at golden hour — article cover photo (picsum seed: orca-article-cover)"
        className="aspect-[1200/630] w-full rounded-xl object-cover"
      />
      <figcaption className="text-meta text-ink3">
        Field notes from the design systems offsite, October 2026 — click the cover to zoom.
      </figcaption>
    </figure>
  ),
};
