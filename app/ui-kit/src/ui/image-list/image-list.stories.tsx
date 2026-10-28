// ImageList stories — standard grid vs masonry columns (picsum seeded URLs).
// Meta has NO `component:` — render-only gallery stories (image.stories pattern).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageList, type ImageListItem } from './index';

const meta = { title: 'Data Display/ImageList', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const standardItems: ImageListItem[] = Array.from({ length: 6 }, (_, i) => ({
  src: `https://picsum.photos/seed/standard-${i + 1}/300/200`,
  alt: `Standard tile ${i + 1}`,
}));

const masonryItems: ImageListItem[] = Array.from({ length: 8 }, (_, i) => ({
  src: `https://picsum.photos/seed/masonry-${i + 1}/300/${160 + (i % 4) * 80}`,
  alt: `Masonry tile ${i + 1}`,
}));

/** Standard — fixed-rowHeight CSS grid, 3 columns; images crop to fill. */
export const Standard: Story = {
  render: () => <ImageList items={standardItems} cols={3} rowHeight={160} gap={8} />,
};

/** Masonry — CSS columns, natural heights, 3 columns; visual order flows top-to-bottom per column. */
export const Masonry: Story = {
  render: () => <ImageList items={masonryItems} cols={3} variant="masonry" gap={8} />,
};

/** WithCaptions — clickable tiles (Enter/Space) with figcaption labels. */
export const WithCaptions: Story = {
  render: () => (
    <ImageList
      items={standardItems.slice(0, 3).map((it, i) => ({
        ...it,
        caption: ['Aurora', 'Coastline', 'Forest'][i],
      }))}
      cols={3}
      onItemClick={(index) => console.info('tile clicked:', index)}
    />
  ),
};

/** MasonryTwoCols — narrower container, 2-column masonry. */
export const MasonryTwoCols: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <ImageList items={masonryItems.slice(0, 6)} cols={2} variant="masonry" gap={12} />
    </div>
  ),
};
