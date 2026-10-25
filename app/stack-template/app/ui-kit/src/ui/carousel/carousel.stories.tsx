import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from './index';
import { Avatar } from '../avatar/index';
import { Button } from '../button/index';
import { CountUp } from '../count-up/index';
import { Statistic } from '../statistic/index';
import { Tag } from '../tag/index';

// Swiper CSS moved out of ui/carousel/index.tsx into entries/carousel.ts (batch ⑩);
// stories import the component directly, so pull the CSS here to keep the Storybook
// canvas styled.
import 'swiper/css';
import 'swiper/css/pagination';

// No `component` in meta (items is a required ReactNode[]) — render-only stories,
// same pattern as pagination.stories.
/** Sliding content rail — hero, media strip, onboarding steps. */
const meta = { title: 'Data Display/Carousel', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

function Slide({ label, tone = 'bg-s3' }: { label: string; tone?: string }) {
  return <div className={`grid h-48 place-items-center rounded-lg ${tone} text-body text-ink`}>{label}</div>;
}

// Photo helper — picsum seeded (same pattern as templates/landing.stories.tsx).
function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

// Gallery images — SVG data-URI (offline-safe, no network dependency in Storybook).
function gallerySlide(label: string, c1: string, c2: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/><text x='50%' y='50%' fill='white' font-size='36' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function GallerySlide({ label, c1, c2 }: { label: string; c1: string; c2: string }) {
  return (
    <img src={gallerySlide(label, c1, c2)} alt={label} className="block h-56 w-full rounded-lg object-cover" />
  );
}

export const Basic: S = {
  name: 'Basic',
  render: () => (
    <Carousel
      items={[<Slide key="1" label="Slide 1" />, <Slide key="2" label="Slide 2" />, <Slide key="3" label="Slide 3" />]}
    />
  ),
};

export const CircularLoop: S = {
  name: 'Circular — loops past the end back to the start',
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

/** Indicators — Pagination-style square bullets with page numbers; click to slide. */
export const Indicators: S = {
  name: 'Indicators — Pagination-style square bullets (click to slide)',
  render: () => (
    <Carousel
      navigators={false}
      className="w-96"
      items={[
        <Slide key="1" label="Slide 1" />,
        <Slide key="2" label="Slide 2" tone="bg-accent/10" />,
        <Slide key="3" label="Slide 3" tone="bg-accent/20" />,
        <Slide key="4" label="Slide 4" tone="bg-accent/30" />,
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
        <Slide key="1" label="Auto 1 — hover to pause" />,
        <Slide key="2" label="Auto 2 — hover to pause" />,
        <Slide key="3" label="Auto 3 — hover to pause" />,
      ]}
    />
  ),
};

export const NoIndicatorsNavigators: S = {
  name: 'No indicators + no navigators',
  render: () => (
    <Carousel
      indicators={false}
      navigators={false}
      items={[<Slide key="1" label="Swipe/keyboard only" />, <Slide key="2" label="Slide 2" />, <Slide key="3" label="Slide 3" />]}
    />
  ),
};

export const Vertical: S = {
  name: 'Vertical — vertical orientation (height 300 default)',
  render: () => (
    <Carousel
      orientation="vertical"
      items={[
        <Slide key="1" label="Vertical 1" />,
        <Slide key="2" label="Vertical 2" />,
        <Slide key="3" label="Vertical 3" />,
      ]}
    />
  ),
};

export const MultipleSlidesPerView: S = {
  name: 'Multiple slides per view — itemsPerView 3',
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

// Local wrapper so hooks live in a real component (rules-of-hooks clean).
function OnSlideChangeDemoInner() {
  const [index, setIndex] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-meta text-ink2">Viewing: index {index}</span>
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
}

export const OnSlideChangeDemo: S = {
  name: 'onSlideChange — shows the current index',
  render: () => <OnSlideChangeDemoInner />,
};

export const GalleryImageCards: S = {
  name: 'Gallery — image cards',
  render: () => (
    <Carousel
      circular
      items={[
        <GallerySlide key="1" label="Mountains" c1="#1677ff" c2="#389e0d" />,
        <GallerySlide key="2" label="Sunset" c1="#d48806" c2="#cf1322" />,
        <GallerySlide key="3" label="Ocean" c1="#1677ff" c2="#531dab" />,
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

/* ── Batch ⑲: extra cases by user request (component API unchanged —
 * no invented props; "per-container" breakpoints are not in the API, so the
 * demo compares fixed itemsPerView values) ── */

export const ResponsiveBreakpoints: S = {
  name: 'Responsive — itemsPerView 1/2/3/4 compared',
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
  name: 'Pagination — active bullet in accent color',
  render: () => (
    <div>
      {/* Story-scoped style: active bullet = accent (component keeps bullets neutral) */}
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
  name: 'Autoplay delay — 2s fast vs 8s slow (hover to pause)',
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <span className="text-meta text-ink2">Fast — 2s (hover to pause)</span>
        <Carousel
          autoplay
          autoplayInterval={2000}
          pauseOnHover
          indicators={false}
          items={[1, 2, 3].map((i) => (
            <div key={i} className="grid h-24 place-items-center rounded-lg bg-accent/10 text-body text-ink">
              Fast — slide {i}
            </div>
          ))}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-meta text-ink2">Slow — 8s (disableOnInteraction=false — dragging keeps it running)</span>
        <Carousel
          autoplay
          autoplayInterval={8000}
          pauseOnHover
          indicators={false}
          items={[1, 2, 3].map((i) => (
            <div key={i} className="grid h-24 place-items-center rounded-lg bg-s3 text-body text-ink">
              Slow — slide {i}
            </div>
          ))}
        />
      </div>
    </div>
  ),
};

export const SingleSlide: S = {
  name: 'SingleSlide — 1 item (nav buttons auto-hidden)',
  render: () => (
    <Carousel
      items={[
        <div key="only" className="grid h-32 place-items-center rounded-lg bg-s3 text-body text-ink">
          One single slide — prev/next auto-hidden (items.length ≤ 1)
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
        'Deploy WEEK-42 to production',
        'Assign saga: fail@demo.local → DLQ',
        'Migrate @wakii-dev/ui-kit 0.1.2',
        'E2E convergence 15/15 PASS',
      ].map((title, i) => (
        <div key={i} className="mr-1 flex flex-col gap-2 rounded-lg border border-line bg-s2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body font-semibold text-ink">{title}</span>
            <Tag>{i % 2 === 0 ? 'deploy' : 'kafka'}</Tag>
          </div>
          <p className="m-0 text-meta text-ink2">
            Long text showing multi-line content inside a slide — line clamping is the
            consumer's call; the slide keeps a fixed h-28 height so layout doesn't jump.
          </p>
        </div>
      ))}
    />
  ),
};

// Local wrapper so hooks live in a real component (rules-of-hooks clean).
function ControlledPageInner() {
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
            Go to slide {n + 1}
          </Button>
        ))}
        <span className="text-meta text-ink2">Viewing: {current + 1}</span>
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
}

export const ControlledPage: S = {
  name: 'Controlled — external buttons jump to a slide',
  render: () => <ControlledPageInner />,
};

export const KeyboardHint: S = {
  name: 'Keyboard — hint ↑↓←→ (focus the carousel)',
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-meta text-ink2">
        Tab into the carousel (focusable container) then use ← → to change slides — keyboard=true by default.
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

export const Empty: S = {
  name: 'Empty — no items (edge: no slides, no nav, no bullets)',
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-meta text-ink2">
        items=[] — an empty h-32 frame, nav auto-hidden (≤1 slide), pagination with no bullets. Consumers should handle the empty state themselves before rendering.
      </span>
      <div className="h-32 rounded-lg border border-dashed border-line grid place-items-center">
        <Carousel items={[]} className="w-full" indicators={false} />
      </div>
    </div>
  ),
};

/* ── Real-world cases (mission #12 — user: "slides must be real photos or
 * HTML, not placeholder boxes"): each story below is a case a product ships,
 * with doc comment explaining when you'd use it. API unchanged. ── */

const PRODUCTS = [
  { seed: 'wakii-shoe', name: 'Trail Runner Pro', price: '$129', tag: 'sale' as const },
  { seed: 'wakii-watch', name: 'Field Watch 38', price: '$249', tag: 'new' as const },
  { seed: 'wakii-headphone', name: 'Studio Headphones', price: '$199', tag: undefined },
  { seed: 'wakii-backpack', name: 'City Backpack 22L', price: '$89', tag: 'sale' as const },
  { seed: 'wakii-lamp', name: 'Desk Lamp Arc', price: '$59', tag: undefined },
];

/** Product gallery — e-commerce PDP: photo + name/price + promo Tag per slide,
 * loop so shoppers can keep swiping past the last product. Real photos
 * (picsum seeded), lazy-loaded; alt describes the product for screen readers. */
export const ProductGallery: S = {
  name: 'Product gallery — e-commerce photos + price + promo tag',
  render: () => (
    <Carousel
      circular
      height={420}
      className="max-w-2xl"
      items={PRODUCTS.map((product) => (
        <div key={product.seed} className="mr-1 flex flex-col gap-2">
          <img
            src={photo(product.seed, 800, 600)}
            alt={`${product.name} — product photo`}
            loading="lazy"
            className="h-72 w-full rounded-lg object-cover"
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex flex-col">
              <span className="text-body font-semibold text-ink">{product.name}</span>
              <span className="text-meta text-ink2">{product.price}</span>
            </div>
            {product.tag && <Tag>{product.tag}</Tag>}
          </div>
        </div>
      ))}
    />
  ),
};

const HERO_SLIDES = [
  { seed: 'wakii-hero-spring', kicker: 'Spring drop', headline: 'New season, new gear', sub: 'Fresh arrivals up to 30% off this week.' },
  { seed: 'wakii-hero-members', kicker: 'Membership', headline: 'Free shipping, always', sub: 'Join Wakii+ and never pay for delivery again.' },
  { seed: 'wakii-hero-collab', kicker: 'Collab', headline: 'Studio Series is back', sub: 'Limited run — last drop sold out in 48 hours.' },
];

/** Hero banner — marketing homepage: autoplaying full-width slides with a
 * scrim-gradient overlay (white copy stays readable on any photo) + CTA.
 * Loop + pauseOnHover so the promo keeps rotating until the shopper engages. */
export const HeroBanner: S = {
  name: 'Hero banner — marketing autoplay + scrim overlay + CTA',
  render: () => (
    <Carousel
      autoplay
      autoplayInterval={4000}
      pauseOnHover
      circular
      height={340}
      navigators={false}
      items={HERO_SLIDES.map((slide) => (
        <div key={slide.seed} className="relative h-full w-full">
          <img
            src={photo(slide.seed, 1200, 500)}
            alt={`${slide.headline} — campaign banner`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {/* scrim gradient — same recipe as auth split hero (var(--scrim-4) base) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--scrim-4)] via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-8">
            <span className="text-meta uppercase tracking-[0.08em] text-white/80">{slide.kicker}</span>
            <span className="text-h1 font-bold text-white drop-shadow-md">{slide.headline}</span>
            <span className="text-body text-white/85">{slide.sub}</span>
            <div className="mt-1">
              <Button type="primary">Shop now</Button>
            </div>
          </div>
        </div>
      ))}
    />
  ),
};

const QUOTES = [
  { initials: 'AL', name: 'Alice Nguyen', role: 'Eng lead, Finhive', quote: 'We replaced three internal tools with one shell — the dark theme alone sold half the team.' },
  { initials: 'BV', name: 'Binh Vu', role: 'CTO, Craftbase', quote: 'Motion is tasteful: reveal on scroll, counters on KPIs, nothing bounces for attention.' },
  { initials: 'CT', name: 'Chi Tran', role: 'PM, Loopscale', quote: 'Pricing page, dashboard, onboarding — all from the same tokens. It looks like one product.' },
  { initials: 'DD', name: 'Duong Do', role: 'Founder, Kite', quote: 'We shipped our landing in a weekend — the kit carried opinions so we could carry features.' },
];

/** Testimonial cards — pure HTML slides (no images at all): proof the carousel
 * takes arbitrary content. Homepage social-proof strip, 2 cards per view. */
export const TestimonialCards: S = {
  name: 'Testimonial cards — HTML-only slides (quotes, no images)',
  render: () => (
    <Carousel
      circular
      itemsPerView={2}
      height={220}
      indicators={false}
      items={QUOTES.map((q) => (
        <div key={q.initials} className="mr-1 flex h-full flex-col gap-3 rounded-xl border border-line bg-s1 p-4">
          <blockquote className="m-0 text-body text-ink2">“{q.quote}”</blockquote>
          <div className="mt-auto flex items-center gap-2">
            <Avatar size={28}>{q.initials}</Avatar>
            <div className="flex flex-col">
              <span className="text-label font-medium text-ink">{q.name}</span>
              <span className="text-meta text-ink3">{q.role}</span>
            </div>
          </div>
        </div>
      ))}
    />
  ),
};

const KPIS: Array<{ title: string; value: number; suffix: string; decimals?: number }> = [
  { title: 'Tasks shipped', value: 128, suffix: 'k' },
  { title: 'Uptime', value: 99.95, suffix: '%', decimals: 2 },
  { title: 'Teams onboard', value: 327, suffix: '+' },
  { title: 'Runtime deps', value: 0, suffix: '' },
];

/** Stat carousel — dashboard/onboarding strip: one KPI per slide with CountUp
 * animating on slide enter. HTML-rich slides carrying live components, not
 * static media. */
export const StatCarousel: S = {
  name: 'Stat carousel — Statistic + CountUp per slide',
  render: () => (
    <Carousel
      circular
      autoplay
      autoplayInterval={3000}
      pauseOnHover
      height={160}
      indicators={false}
      items={KPIS.map((kpi) => (
        <div key={kpi.title} className="mr-1 grid h-full place-items-center rounded-xl border border-line bg-s1">
          <Statistic
            title={kpi.title}
            value={<CountUp value={kpi.value} decimals={kpi.decimals ?? 0} />}
            suffix={kpi.suffix}
          />
        </div>
      ))}
    />
  ),
};
