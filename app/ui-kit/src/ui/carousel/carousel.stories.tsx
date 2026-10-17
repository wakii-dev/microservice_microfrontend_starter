import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './index';

// Không set component (items là ReactNode[] required) — render-only stories,
// cùng pattern pagination.stories.
const meta = { title: 'Data Display/Carousel', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

function Slide({ label, tone = 'bg-s3' }: { label: string; tone?: string }) {
  return <div className={`grid h-48 place-items-center rounded-lg ${tone} text-body text-ink`}>{label}</div>;
}

// Gallery ảnh — SVG data-URI (offline-safe, không phụ thuộc mạng trong Storybook).
function gallerySlide(label: string, c1: string, c2: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/><text x='50%' y='50%' fill='white' font-size='36' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function GallerySlide({ label, c1, c2 }: { label: string; c1: string; c2: string }) {
  return (
    <img src={gallerySlide(label, c1, c2)} alt={label} className="block h-56 w-full rounded-lg object-cover" />
  );
}

export const CoBan: S = {
  render: () => (
    <Carousel
      items={[<Slide key="1" label="Slide 1" />, <Slide key="2" label="Slide 2" />, <Slide key="3" label="Slide 3" />]}
    />
  ),
};

export const CircularLoop: S = {
  name: 'Circular — loop qua cuối về đầu',
  render: () => (
    <Carousel
      circular
      items={[
        <Slide key="1" label="Loop 1" tone="bg-accent/10" />,
        <Slide key="2" label="Loop 2" tone="bg-accent/20" />,
        <Slide key="3" label="Loop 3" tone="bg-accent/30" />,
      ]}
    />
  ),
};

export const AutoplayPauseOnHover: S = {
  name: 'Autoplay + pause on hover',
  render: () => (
    <Carousel
      autoplay
      autoplayInterval={2000}
      pauseOnHover
      items={[
        <Slide key="1" label="Auto 1 — hover để pause" />,
        <Slide key="2" label="Auto 2 — hover để pause" />,
        <Slide key="3" label="Auto 3 — hover để pause" />,
      ]}
    />
  ),
};

export const KhongIndicatorsNavigators: S = {
  name: 'Không indicators + không navigators',
  render: () => (
    <Carousel
      indicators={false}
      navigators={false}
      items={[<Slide key="1" label="Chỉ swipe/keyboard" />, <Slide key="2" label="Slide 2" />, <Slide key="3" label="Slide 3" />]}
    />
  ),
};

export const DocVertical: S = {
  name: 'Dọc — vertical (height 300 default)',
  render: () => (
    <Carousel
      orientation="vertical"
      items={[
        <Slide key="1" label="Dọc 1" />,
        <Slide key="2" label="Dọc 2" />,
        <Slide key="3" label="Dọc 3" />,
      ]}
    />
  ),
};

export const NhieuSlideMoiView: S = {
  name: 'Nhiều slide mỗi view — itemsPerView 3',
  render: () => (
    <Carousel
      itemsPerView={3}
      items={[
        <Slide key="1" label="1" />,
        <Slide key="2" label="2" />,
        <Slide key="3" label="3" />,
        <Slide key="4" label="4" />,
        <Slide key="5" label="5" />,
        <Slide key="6" label="6" />,
      ]}
    />
  ),
};

export const OnSlideChangeDemo: S = {
  name: 'onSlideChange — hiện index đang xem',
  render: () => {
    const [index, setIndex] = useState(0);
    return (
      <div className="flex flex-col gap-2">
        <span className="text-meta text-ink2">Đang xem: index {index}</span>
        <Carousel
          onSlideChange={setIndex}
          items={[
            <Slide key="1" label="Slide 1" />,
            <Slide key="2" label="Slide 2" />,
            <Slide key="3" label="Slide 3" />,
            <Slide key="4" label="Slide 4" />,
          ]}
        />
      </div>
    );
  },
};

export const GalleryAnhCards: S = {
  name: 'Gallery ảnh cards',
  render: () => (
    <Carousel
      circular
      items={[
        <GallerySlide key="1" label="Sông núi" c1="#1677ff" c2="#389e0d" />,
        <GallerySlide key="2" label="Hoàng hôn" c1="#d48806" c2="#cf1322" />,
        <GallerySlide key="3" label="Biển cả" c1="#1677ff" c2="#531dab" />,
      ]}
    />
  ),
};
