// Overlay EXTRA: carousel — trang demo <Carousel> qua subpath '@wakii/ui-kit/carousel'.
// ⚠️ PEER DEP: "swiper": "^14.3.0" (entry subpath tự kéo swiper/css).
// Redesign 2026-10-25 v2: hero autoplay 1/view + card rail 3/view. Lưu ý engine
// kit: spaceBetween hardcoded 0 → gutter phải tự tạo bằng padding trong slide;
// nút navigator absolute left-2/right-2 → container rail cần px đủ rộng để nút
// không đè card (px-10 > 26px nút + 8px offset); indicators là chip SỐ kiểu
// Pagination — chỉ bật ở hero, rail tắt cho nhẹ.
// import CSS swiper tại CONSUMER — liên kết css của dep-optimizer (metadata
// css:None) không đáng tin sau re-optimize; import trực tiếp luôn hoạt động.
import 'swiper/css';
import { Carousel } from '@wakii/ui-kit/carousel';
import { Icon, Tag, Text, Title, type IconName } from '@wakii/ui-kit';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

const HERO_SLIDES: { icon: IconName; name: string; desc: string }[] = [
  { icon: 'star', name: 'Aurora', desc: 'Hero slides with autoplay, indicators and keyboard arrows.' },
  { icon: 'heart', name: 'Cascade', desc: 'Pause on hover, loop back to the start with circular mode.' },
  { icon: 'bell', name: 'Nimbus', desc: 'Navigators fade at the edges — content stays the star.' },
  { icon: 'users', name: 'Dune', desc: 'Every slide is plain React — style it however you like.' },
];

const heroItems = HERO_SLIDES.map((s) => (
  <div
    key={s.name}
    className="relative flex h-64 flex-col items-start justify-end gap-2 overflow-hidden rounded-xl border border-line bg-gradient-to-br from-accent/20 via-s2 to-s1 p-8"
  >
    <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-6 size-40 rounded-pill bg-accent/15 blur-2xl" />
    <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-accent">
      <Icon name={s.icon} size={18} className="text-white" />
    </span>
    <Title level={3}>{s.name}</Title>
    <Text type="secondary">{s.desc}</Text>
  </div>
));

const RAIL_CARDS: { icon: IconName; name: string; desc: string }[] = [
  { icon: 'menu-bars', name: 'Grid view', desc: 'Dense dashboards' },
  { icon: 'sort', name: 'List view', desc: 'Feeds & digests' },
  { icon: 'folder', name: 'Files', desc: 'Trees & tables' },
  { icon: 'calendar', name: 'Calendar', desc: 'Date-driven UI' },
  { icon: 'clock', name: 'Timeline', desc: 'Activity feeds' },
  { icon: 'check-circle', name: 'Forms', desc: 'zod-validated' },
];

const railItems = RAIL_CARDS.map((c) => (
  <div key={c.name} className="h-40 px-1.5">
    <div className="flex h-full flex-col items-start justify-between rounded-xl border border-line bg-s1 p-5">
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-accent/10">
        <Icon name={c.icon} size={16} className="text-accent" />
      </span>
      <div className="flex flex-col items-start gap-0.5">
        <Text strong>{c.name}</Text>
        <Text type="secondary">{c.desc}</Text>
      </div>
    </div>
  </div>
));

/** Route gợi ý cho engine: '/carousel'. */
export function CarouselDemo() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>Extra · swiper</span>
        <Title level={1}>Carousel, two ways</Title>
        <div className="max-w-2xl">
          <Text type="secondary">
            Swiper-powered — a full-bleed hero loop and a card rail with 3 slides per view. Use ← → keys on the
            hero; the rail navigates with the side arrows.
          </Text>
        </div>
      </div>

      <Carousel
        autoplay
        autoplayInterval={3500}
        circular
        indicators
        items={heroItems}
        keyboard
        navigators
        pauseOnHover
        height={256}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text strong>Component rail</Text>
          <Tag>3 per view</Tag>
        </div>
        {/* px-10 nhường không gian cho nút navigator absolute (left-2, 26px) */}
        <div className="px-10">
          <Carousel items={railItems} itemsPerView={3} indicators={false} navigators height={160} />
        </div>
      </div>
    </div>
  );
}
