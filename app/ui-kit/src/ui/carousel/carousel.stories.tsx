import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './index';
import { Button } from '../button/index';
import { Tag } from '../tag/index';

// CSS swiper — đã rời ui/carousel/index.tsx sang entries/carousel.ts (batch ⑩); stories
// import component trực tiếp nên tự kéo CSS tại đây để canvas Storybook giữ style.
import 'swiper/css';
import 'swiper/css/pagination';

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

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <Carousel
        items={[<Slide key="1" label="Slide 1" />, <Slide key="2" label="Slide 2" />, <Slide key="3" label="Slide 3" />]}
      />
    </div>
  ),
};

/* ── Batch ⑲: mở rộng case theo yêu cầu user (giữ nguyên API component —
 * không bịa props; breakpoints "theo container" chưa có trong API nên demo
 * so sánh itemsPerView cố định) ── */

export const ResponsiveBreakpoints: S = {
  name: 'Responsive — so sánh itemsPerView 1/2/3/4',
  render: () => (
    <div className="flex flex-col gap-4">
      {([1, 2, 3, 4] as const).map((per) => (
        <div key={per} className="flex flex-col gap-1">
          <span className="text-meta text-ink2">itemsPerView = {per}</span>
          <Carousel
            itemsPerView={per}
            circular
            items={Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="mr-1 grid h-20 place-items-center rounded-lg bg-s3 text-body text-ink">
                {i + 1}
              </div>
            ))}
          />
        </div>
      ))}
    </div>
  ),
};

export const PaginationStyles: S = {
  name: 'Pagination — bullet active màu accent',
  render: () => (
    <div>
      {/* Scoped style story-level: bullet active = accent (component giữ bullet trung tính) */}
      <style>{`.pag-accent .swiper-pagination-bullet-active{background:var(--accent) !important;opacity:1}`}</style>
      <div className="pag-accent">
        <Carousel
          circular
          items={[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid h-32 place-items-center rounded-lg bg-accent/10 text-body text-ink">
              Slide {i}
            </div>
          ))}
        />
      </div>
    </div>
  ),
};

export const AutoplayDelay: S = {
  name: 'Autoplay delay — 2s nhanh vs 8s chậm (hover pause)',
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <span className="text-meta text-ink2">Nhanh — 2s (hover để pause)</span>
        <Carousel
          autoplay
          autoplayInterval={2000}
          pauseOnHover
          indicators={false}
          items={[1, 2, 3].map((i) => (
            <div key={i} className="grid h-24 place-items-center rounded-lg bg-accent/10 text-body text-ink">
              Nhanh — slide {i}
            </div>
          ))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-meta text-ink2">Chậm — 8s (disableOnInteraction=false — kéo vẫn tiếp tục chạy)</span>
        <Carousel
          autoplay
          autoplayInterval={8000}
          pauseOnHover
          indicators={false}
          items={[1, 2, 3].map((i) => (
            <div key={i} className="grid h-24 place-items-center rounded-lg bg-s3 text-body text-ink">
              Chậm — slide {i}
            </div>
          ))}
        />
      </div>
    </div>
  ),
};

export const SingleSlide: S = {
  name: 'SingleSlide — 1 item (nút điều hướng tự ẩn)',
  render: () => (
    <Carousel
      items={[
        <div key="only" className="grid h-32 place-items-center rounded-lg bg-s3 text-body text-ink">
          Duy nhất một slide — prev/next tự ẩn (items.length ≤ 1)
        </div>,
      ]}
    />
  ),
};

export const LongContent: S = {
  name: 'LongContent — text cards + badge',
  render: () => (
    <Carousel
      circular
      itemsPerView={2}
      items={[
        'Deploy WEEK-42 lên production',
        'Saga gán task: fail@demo.local → DLQ',
        'Migration package @wakii-dev/ui-kit 0.1.2',
        'E2E convergence 15/15 PASS',
      ].map((title, i) => (
        <div key={i} className="mr-1 flex flex-col gap-2 rounded-lg border border-line bg-s2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body font-semibold text-ink">{title}</span>
            <Tag>{i % 2 === 0 ? 'deploy' : 'kafka'}</Tag>
          </div>
          <p className="m-0 text-meta text-ink2">
            Log dài minh hoạ nội dung nhiều dòng trong slide — line-clamp do consumer
            quyết định; slide giữ chiều cao cố định h-28 để không nhảy layout.
          </p>
        </div>
      ))}
    />
  ),
};

export const ControlledPage: S = {
  name: 'Controlled — nút ngoài jump tới slide',
  render: () => {
    const [current, setCurrent] = useState(0);
    const boxRef = useRef<HTMLDivElement>(null);
    const jump = (n: number) => {
      const el = boxRef.current?.querySelector('.swiper') as (HTMLElement & { swiper?: { slideTo: (i: number) => void } }) | null;
      el?.swiper?.slideTo(n);
    };
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((n) => (
            <Button key={n} size="small" type={n === current ? 'primary' : 'default'} onClick={() => jump(n)}>
              Tới slide {n + 1}
            </Button>
          ))}
          <span className="text-meta text-ink2">Đang xem: {current + 1}</span>
        </div>
        <div ref={boxRef}>
          <Carousel
            onSlideChange={setCurrent}
            items={[0, 1, 2].map((i) => (
              <div key={i} className="grid h-32 place-items-center rounded-lg bg-accent/10 text-h2 font-semibold text-ink">
                {i + 1}
              </div>
            ))}
          />
        </div>
      </div>
    );
  },
};

export const KeyboardHint: S = {
  name: 'Keyboard — hint ↑↓←→ (focus vào carousel)',
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-meta text-ink2">
        Tab vào carousel (container focusable) rồi dùng ← → để chuyển slide — keyboard=true mặc định.
      </span>
      <Carousel
        circular
        items={[1, 2, 3].map((i) => (
          <div key={i} className="grid h-32 place-items-center rounded-lg bg-s3 text-h2 font-semibold text-ink">
            {i + 1}
          </div>
        ))}
      />
    </div>
  ),
};
