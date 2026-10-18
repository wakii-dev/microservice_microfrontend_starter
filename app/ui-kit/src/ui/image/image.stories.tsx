// Parity matrix antd→tokens: docs/parity-matrix.md
// UiImage stories — click image to open preview overlay (ESC / click closes).
// Offline-safe data-URI images. Focus is trapped in the overlay; closing returns
// focus to the thumbnail.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UiImage } from './index';

const meta = { title: 'Data Display/Image', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function svgImg(label: string, c1: string, c2: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='640' height='400' fill='url(%23g)'/><text x='50%' y='50%' fill='white' font-size='36' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const Basic: Story = {
  name: 'Basic — image with fade-in on load',
  render: () => <UiImage src={svgImg('Demo image', '#1677ff', '#389e0d')} alt="Gradient demo image" width={360} />,
};

export const Preview: Story = {
  name: 'Preview — click image → overlay; ESC / click closes',
  render: () => (
    <div className="flex flex-col gap-2">
      <UiImage src={svgImg('Click to zoom', '#531dab', '#1677ff')} alt="Preview demo image" width={360} />
      <span className="text-meta text-ink3">Click image → full-screen overlay; ESC or click overlay closes it. Focus is trapped inside, and returns to the thumbnail on close.</span>
    </div>
  ),
};

export const Sizes: Story = {
  name: 'Sizes — width as number (px) vs CSS string',
  render: () => (
    <div className="flex items-start gap-4">
      <UiImage src={svgImg('240px', '#1677ff', '#389e0d')} alt="240 px image" width={240} />
      <UiImage src={svgImg('50%', '#d48806', '#cf1322')} alt="50% image" width="50%" />
    </div>
  ),
};
