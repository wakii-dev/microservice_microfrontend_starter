import type { Meta, StoryObj } from '@storybook/react-vite';
import { Galleria } from './index';
const meta = { title: 'Data Display/Galleria', component: Galleria, tags: ['autodocs'] } satisfies Meta<typeof Galleria>;
export default meta;
type S = StoryObj<typeof meta>;

// SVG data-URI gradient images — offline-safe, no network dependency (carousel
// stories pattern). Replaced the old alipay CDN images (broke offline).
function gradImg(label: string, c1: string, c2: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='640' height='360' fill='url(#g)'/><text x='50%' y='50%' fill='white' font-size='36' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const IMAGES = [
  { src: gradImg('Mountains', '#1677ff', '#389e0d'), alt: 'Mountains' },
  { src: gradImg('Sunset', '#d48806', '#cf1322'), alt: 'Sunset', caption: 'Sunset over the bay' },
  { src: gradImg('Ocean', '#1677ff', '#531dab'), alt: 'Ocean' },
];

export const Basic: S = { name: 'Basic', args: { images: IMAGES } };

export const Captions: S = {
  name: 'Captions — caption below image',
  args: {
    images: [
      { src: IMAGES[0].src, alt: 'Mountains', caption: 'Northern range — shot in June' },
      { src: IMAGES[1].src, alt: 'Sunset', caption: 'Sunset over the bay' },
      { src: IMAGES[2].src, alt: 'Ocean', caption: 'Early morning, clear water' },
    ],
  },
};

export const SingleImage: S = {
  name: 'Single — one image (single dot indicator)',
  args: { images: [IMAGES[0]] },
};

export const DarkTheme: S = {
  name: 'Dark theme',
  args: { images: IMAGES },
  render: (args) => (
    <div data-bp-theme="dark" className="w-[480px] rounded-xl bg-canvas p-4">
      <Galleria {...args} />
    </div>
  ),
};
