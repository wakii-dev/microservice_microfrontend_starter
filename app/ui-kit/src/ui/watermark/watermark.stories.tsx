// Watermark stories — basic text, multi-line, media block, custom style.
// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Watermark } from './index';

const meta = {
  title: 'Primitives/Watermark',
  component: Watermark,
  tags: ['autodocs'],
} satisfies Meta<typeof Watermark>;
export default meta;

// StoryObj không generic (pattern Popconfirm) — meta có component, story render-only.
type Story = StoryObj;

export const Basic: Story = {
  name: 'Basic text — full-area tile, default -22° ink3',
  render: () => (
    <Watermark content="CONFIDENTIAL" className="p-6">
      <div className="rounded-xl border border-line bg-s1 p-6 text-body text-ink2">
        Draft contract v2 — internal use only. The overlay is pointer-events-none,
        so this text stays selectable and copyable.
      </div>
    </Watermark>
  ),
};

export const MultiLine: Story = {
  name: 'Multi-line content — array of lines, tighter gap',
  render: () => (
    <Watermark content={['wakii', 'demo workspace']} gap={[60, 60]} className="p-6">
      <div className="rounded-xl border border-line bg-s1 p-6 text-body text-ink2">
        Two-line watermark (antd content prop accepts an array of lines).
      </div>
    </Watermark>
  ),
};

export const MediaBlock: Story = {
  name: 'Media block — protect preview imagery (corner-anchored overlay)',
  render: () => (
    <Watermark
      content="© wakii studio"
      gap={[48, 48]}
      opacity={0.75}
      className="w-fit"
    >
      <div className="grid h-44 w-72 place-items-center rounded-xl bg-s3 text-ink3">
        product-photograph.png
      </div>
    </Watermark>
  ),
};

export const CustomStyle: Story = {
  name: 'Custom style — rotate, opacity, font, color, z-index',
  render: () => (
    <Watermark
      content="DRAFT"
      rotate={-45}
      opacity={0.6}
      zIndex={20}
      font={{ fontSize: 24, fontWeight: 'bold' }}
      className="p-6"
    >
      <div className="rounded-xl border border-line bg-s1 p-6 text-body text-ink2">
        Steeper angle + bold 24px tile for heavy drafts.
      </div>
    </Watermark>
  ),
};

export const CornerAnchored: Story = {
  name: 'Corner anchored — left/top/width/height instead of full area',
  render: () => (
    <Watermark content="SAMPLE" left={16} top={16} width={180} height={80} className="p-6">
      <div className="h-40 rounded-xl border border-line bg-s1 p-6 text-body text-ink2">
        Overlay pinned at (16, 16) sized 180×80 — the rest of the block stays clean.
      </div>
    </Watermark>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — tile re-bakes to dark --ink3',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Watermark content="INTERNAL" className="p-6">
        <div className="rounded-xl border border-line bg-s1 p-6 text-body text-ink2">
          Tile color resolves --ink3 inside the dark scope.
        </div>
      </Watermark>
    </div>
  ),
};
