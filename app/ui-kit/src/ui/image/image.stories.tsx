// Parity matrix antd→tokens: docs/parity-matrix.md
// UiImage stories — ảnh click preview overlay (ESC/ click đóng). Ảnh data-URI
// offline-safe. Fallback: component chưa có prop fallback (chỉ src/alt/width).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { UiImage } from './index';

const meta = { title: 'Data Display/Image', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function svgImg(label: string, c1: string, c2: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='640' height='400' fill='url(%23g)'/><text x='50%' y='50%' fill='white' font-size='36' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CoBan: Story = {
  name: 'Cơ bản — ảnh + fade-in khi load',
  render: () => <UiImage src={svgImg('Ảnh demo', '#1677ff', '#389e0d')} alt="Ảnh demo gradient" width={360} />,
};

export const Preview: Story = {
  name: 'Preview — click ảnh → overlay, ESC/click đóng',
  render: () => (
    <div className="flex flex-col gap-2">
      <UiImage src={svgImg('Click để phóng', '#531dab', '#1677ff')} alt="Ảnh preview demo" width={360} />
      <span className="text-meta text-ink3">Click ảnh → overlay toàn màn; ESC hoặc click overlay để đóng.</span>
    </div>
  ),
};
