// BentoGrid — lưới 5 ô bất đối xứng (redesign shell-kit 2026-10-27): ô compose
// từ Card kit (hoverable = hover lift của kit) + reveal vào viewport bằng
// Reveal kit (thay framer whileInView) · carousel gallery ảnh (subpath
// @wakii/ui-kit/carousel) · counter = Statistic + CountUp kit, khởi chạy khi ô
// vào viewport (useInView hook kit) · mini chart CSS bars (0 deps — không
// chart.js peer cho shell; motion bars giữ framer, MotionConfig reducedMotion
// ở HomePage lo reduced-motion).
import { motion } from 'framer-motion';
import { Carousel } from '@wakii/ui-kit/carousel';
import { Card, CountUp, Icon, Reveal, Statistic, useInView, type IconName } from '@wakii/ui-kit';

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const FEATURES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'copy',
    title: 'Module federation, wired',
    body: 'Host + 2 remotes share one react-query cache — create a task, watch the activity feed update.',
  },
  {
    icon: 'settings',
    title: 'Conventions over config',
    body: 'Ports, healthchecks, error envelopes, async messaging — nine platform conventions, enforced in CI.',
  },
];

function FeatureCell({ icon, title, body, index }: { icon: IconName; title: string; body: string; index: number }) {
  return (
    <Reveal direction="up" rootMargin="0px 0px -60px 0px" delay={index * 80} className="h-full">
      <Card hoverable className="h-full">
        <div className="flex h-full flex-col gap-3">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon name={icon} size={18} />
          </span>
          <h3 className="m-0 text-body font-semibold text-ink">{title}</h3>
          <p className="m-0 text-meta text-ink2">{body}</p>
        </div>
      </Card>
    </Reveal>
  );
}

/** Carousel gallery — ảnh picsum (subpath carousel, swiper css theo entry);
 * Card cover để ảnh tràn viền trên (không padding), caption nằm body. */
function GalleryCell() {
  return (
    <Reveal direction="up" rootMargin="0px 0px -60px 0px" className="h-full">
      <Card
        className="h-full"
        size="small"
        cover={
          <Carousel
            height={200}
            circular
            items={[1, 2, 3].map((i) => (
              <img
                key={i}
                src={photo(`wakii-shell-gallery-${i}`, 640, 400)}
                alt={`Showcase visual ${i} — product imagery`}
                loading="lazy"
                className="h-[200px] w-full object-cover"
              />
            ))}
          />
        }
      >
        <p className="m-0 text-meta text-ink3">
          <span className="font-medium text-ink2">Carousel</span> — swiper loop, keyboard + drag, one prop.
        </p>
      </Card>
    </Reveal>
  );
}

/** Counter — Statistic + CountUp kit khởi chạy khi ô vào viewport (useInView kit). */
function CounterCell() {
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, rootMargin: '0px 0px -60px 0px' });
  const stats = [
    { label: 'Components', value: 90, suffix: '+' },
    { label: 'Tests pass', value: 1235, suffix: '' },
    { label: 'Runtime deps', value: 0, suffix: '' },
  ];
  return (
    <Reveal direction="up" rootMargin="0px 0px -60px 0px" className="h-full">
      <Card className="h-full">
        <div className="flex h-full flex-col gap-3">
          <h3 className="m-0 text-body font-semibold text-ink">By the numbers</h3>
          <div ref={ref} className="grid flex-1 content-center gap-3">
            {stats.map((stat) => (
              <Statistic
                key={stat.label}
                title={stat.label}
                value={inView ? <CountUp value={stat.value} /> : 0}
                suffix={stat.suffix || undefined}
                /* root Statistic trống class mặc định — ghép layout hàng an toàn */
                classNames={{ root: 'flex items-baseline justify-between gap-2' }}
              />
            ))}
          </div>
        </div>
      </Card>
    </Reveal>
  );
}

const BARS = [34, 58, 42, 76, 61, 92];

/** Mini chart — CSS bars thuần token (shell không có peer chart.js — xem report). */
function ChartCell() {
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, rootMargin: '0px 0px -60px 0px' });
  return (
    <Reveal direction="up" rootMargin="0px 0px -60px 0px" className="h-full">
      <Card className="h-full">
        <div className="flex h-full flex-col gap-3">
          <h3 className="m-0 text-body font-semibold text-ink">E2E convergence</h3>
          <div className="flex flex-1 items-end justify-between gap-2" aria-hidden="true">
            {BARS.map((height, i) => (
              <motion.div
                key={i}
                className="w-full rounded-t-md bg-accent/25"
                style={{ height: inView ? `${height}%` : '4%' }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                animate={{ height: inView ? `${height}%` : '4%' }}
              />
            ))}
          </div>
          <p className="m-0 text-meta text-ink3">15/15 steps — happy path qua Kafka + saga → DLQ.</p>
        </div>
      </Card>
    </Reveal>
  );
}

/** Bento grid — 5 ô bất đối xứng (md: 3 cột, feature wide đầu). */
export function BentoGrid() {
  return (
    <section aria-label="Capabilities" className="flex flex-col gap-4 py-10">
      <h2 className="m-0 text-center text-h1 font-bold text-ink">Everything wired, ready to fork</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <FeatureCell icon={FEATURES[0]!.icon} title={FEATURES[0]!.title} body={FEATURES[0]!.body} index={0} />
        </div>
        <GalleryCell />
        <FeatureCell icon={FEATURES[1]!.icon} title={FEATURES[1]!.title} body={FEATURES[1]!.body} index={1} />
        <CounterCell />
        <ChartCell />
      </div>
    </section>
  );
}
