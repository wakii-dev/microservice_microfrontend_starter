// Templates/Landing — trang marketing HOÀN CHỈNH ghép từ kit: hero (Tag +
// Typography Title/Text + CTA + Parallax ảnh picsum) · stats strip (Statistic +
// CountUp) · features grid 6 (Reveal stagger + Card + Icon) · pricing 3 gói
// (Card hoverable + Segmented monthly/yearly, giá CountUp replay khi đổi kỳ) ·
// testimonials (Avatar + Divider) · CTA cuối + footer.
// 100% component ui-kit, tokens-only mọi className — dark ăn nhờ cascade
// data-bp-theme="dark" (toolbar Theme). Motion: mỗi primitive một element
// (Parallax scroll · Reveal viewport · CountUp state — không giành transform).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../ui/avatar/index';
import { Badge } from '../ui/badge/index';
import { AvatarGroup } from '../ui/avatar-group/index';
import { Button } from '../ui/button/index';
import { Card } from '../ui/card/index';
import { Carousel } from '../ui/carousel/index';
import { Chart, type ChartConfig } from '../ui/chart/index';
import { Collapse } from '../ui/collapse/index';
import { CountUp } from '../ui/count-up/index';
import { Divider } from '../ui/divider/index';
import { Icon, type IconName } from '../ui/icons/index.js';
import { Parallax } from '../ui/parallax/index';
import { Starfield } from './experience/lib/starfield.js';
import { Reveal } from '../ui/reveal/index';
import { Timeline } from '../ui/timeline/index';
import { Segmented } from '../ui/segmented/index';
import { Statistic } from '../ui/statistic/index';
import { Tag } from '../ui/tag/index';
import { Text, Title } from '../ui/typography/index';

const meta = { title: 'Templates/Landing', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const LOGOS = ['ACME CORP', 'NORTHWIND', 'GLOBEX', 'INITECH', 'UMBRELLA', 'SOYLENT'];

/** Sparkline data 8 điểm cho mỗi metric (pattern chart mini). */
const SPARKS: Record<string, { points: number[]; color: string }> = {
  uptime: { points: [10, 10, 9.8, 10, 9.9, 10, 10, 10], color: '#52c41a' },
  tasks: { points: [4, 6, 5, 8, 7, 10, 9, 12], color: '#1677ff' },
  teams: { points: [2, 3, 3, 5, 6, 6, 8, 9], color: '#722ed1' },
  mttr: { points: [9, 8, 8, 7, 6, 6, 5, 4], color: '#fa8c16' },
};

function sparkConfig(points: number[], color: string): ChartConfig {
  return {
    type: 'line',
    labels: points.map((_, i) => String(i)),
    datasets: [{ label: 'spark', data: points, borderColor: color, borderWidth: 2 }],
    options: {
      // tension + ẩn point qua options — ChartDataset của kit chỉ định kiểu hẹp (W8)
      elements: { line: { tension: 0.4 }, point: { radius: 0 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  };
}

const FAQS = [
  { q: 'Có cần thẻ tín dụng để bắt đầu?', a: 'Không — gói Start miễn phí vô thời hạn, nâng cấp khi bạn cần.' },
  { q: 'Dữ liệu có rời khỏi cluster của chúng tôi không?', a: 'Không. Enterprise chạy dedicated cluster; dữ liệu chỉ phục vụ board và activity trong workspace của bạn.' },
  { q: 'Saga gán task thất bại thì sao?', a: 'Task được bôi đỏ vào DLQ kèm lý do — re-assign có chủ đích, không tự reset.' },
  { q: 'Hỗ trợ kiểu gì?', a: 'Community cho Start, priority 24/7 cho Pro, SLA 99.95% + TAM cho Enterprise.' },
];

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const FEATURES: Array<{ icon: IconName; title: string; body: string }> = [
  { icon: 'check-circle', title: 'Tasks without friction', body: 'Create, assign, close — keyboard-first flows with zero config.' },
  { icon: 'users', title: 'Teams in sync', body: 'Assignments, mentions and presence across every remote.' },
  { icon: 'refresh', title: 'Real-time by default', body: 'Kafka events drive activity feeds the moment work moves.' },
  { icon: 'calendar', title: 'Sane scheduling', body: 'Weekly planning views with timezone-safe date handling.' },
  { icon: 'filter', title: 'Find anything', body: 'Global filter, saved views and column-level search.' },
  { icon: 'clock', title: 'Fast on slow days', body: 'Virtualized tables and GPU-only motion — smooth at 10k rows.' },
];

type Plan = { name: string; price: number; blurb: string; perks: string[]; featured?: boolean };
const PLANS: Record<'monthly' | 'yearly', Plan[]> = {
  monthly: [
    { name: 'Start', price: 0, blurb: 'For solo makers', perks: ['Up to 3 projects', 'Community support'] },
    { name: 'Pro', price: 12, blurb: 'For growing teams', perks: ['Unlimited projects', 'Real-time activity', 'Priority support'], featured: true },
    { name: 'Enterprise', price: 49, blurb: 'For orgs with rules', perks: ['SSO + audit log', 'Dedicated cluster', 'SLA 99.95%'] },
  ],
  yearly: [
    { name: 'Start', price: 0, blurb: 'For solo makers', perks: ['Up to 3 projects', 'Community support'] },
    { name: 'Pro', price: 10, blurb: 'For growing teams', perks: ['Unlimited projects', 'Real-time activity', 'Priority support'], featured: true },
    { name: 'Enterprise', price: 39, blurb: 'For orgs with rules', perks: ['SSO + audit log', 'Dedicated cluster', 'SLA 99.95%'] },
  ],
} as const;

const QUOTES = [
  { initials: 'AL', name: 'Alice Nguyen', role: 'Eng lead, Finhive', quote: 'We replaced three tools with one shell and two remotes. The dark theme alone sold half the team.' },
  { initials: 'BV', name: 'Binh Vu', role: 'CTO, Craftbase', quote: 'Motion is tasteful — reveal on scroll, counters on KPIs. Nothing bounces for attention.' },
  { initials: 'CT', name: 'Chi Tran', role: 'PM, Loopscale', quote: 'Pricing page, dashboard, onboarding — all from the same tokens. It just looks like one product.' },
];

/** HERO rich — gradient sáng + blueprint grid + particle trôi + ALL-CAPS 3 dòng lệch khối
 * + 2 CTA + social proof (AvatarGroup + logo marquee bp-marquee). Token-only, dark ăn cascade. */
function Hero({ onCta }: { onCta?: () => void }) {
  const [email, setEmail] = useState('');
  return (
    <section className="relative overflow-hidden rounded-xl border border-line">
      {/* Nền: gradient sáng + blueprint grid mờ (mask tan giữa) */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(165deg, var(--hero-sky-b) 0%, var(--hero-sky-a) 45%, var(--c-s1) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--navy-ink) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--navy-ink) 6%, transparent) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(115% 85% at 50% 30%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(115% 85% at 50% 30%, black 30%, transparent 80%)',
        }}
      />
      {/* Particle trôi — Starfield theme-aware (navy trên sáng / trắng trên tối) */}
      <Starfield className="absolute inset-0 h-full w-full opacity-70" />

      {/* Display ALL-CAPS 3 dòng lệch khối + 2 CTA */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-16 pt-24 text-center">
        <Tag icon={<Icon name="check-circle" size={12} />}>v1.0 — production ready</Tag>
        <div className="grid gap-0 font-extrabold uppercase leading-[0.95] tracking-tight text-ink">
          <Reveal direction="left">
            <div className="text-6xl xl:text-7xl">Ship</div>
          </Reveal>
          <Reveal direction="left" delay={100}>
            <div className="ml-10 text-6xl text-accent xl:ml-20 xl:text-7xl">work, not</div>
          </Reveal>
          <Reveal direction="left" delay={200}>
            <div className="ml-24 text-6xl xl:ml-40 xl:text-7xl">tooling</div>
          </Reveal>
        </div>
        <Text type="secondary" className="max-w-xl text-body">
          Một design system kể chuyện bằng chuyển động — hero, board, pricing đều nói
          cùng một ngôn ngữ token.
        </Text>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="primary" size="large" onClick={onCta} className="whitespace-nowrap">
            Get started free
          </Button>
          <Button size="large" icon={<Icon name="external-link" size={14} />} className="whitespace-nowrap">
            Read the docs
          </Button>
        </div>

        {/* Social proof — AvatarGroup + logo strip marquee */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <AvatarGroup
            size={30}
            items={[
              { name: 'Alice Nguyen' },
              { name: 'Binh Vu' },
              { name: 'Chi Tran' },
              { name: 'Duong Le' },
              { name: 'Giang Pham' },
            ]}
            max={4}
          />
          <p className="m-0 text-meta uppercase tracking-[2.4px] text-ink3">trusted by teams at</p>
        </div>
      </div>

      {/* Logo strip marquee — track 2× nội dung, bp-marquee translateX(-50%) */}
      <div
        aria-hidden="true"
        className="relative z-10 overflow-hidden border-y border-line py-4"
        style={{
          maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
        }}
      >
        <div className="flex w-max animate-[bp-marquee_28s_linear_infinite] items-center gap-14 pr-14">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <span
              key={`${logo}-${i}`}
              className="whitespace-nowrap font-mono text-[13px] font-bold uppercase tracking-[3px] text-ink3 opacity-70"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Metrics band — 4 Card: Statistic CountUp + sparkline Chart mini + delta Tag. */
function MetricsBand() {
  const METRICS = [
    { title: 'Tasks shipped', value: 128, suffix: 'k', spark: SPARKS.tasks, delta: '+12.4%' },
    { title: 'Uptime', value: 99.98, decimals: 2, suffix: '%', spark: SPARKS.uptime, delta: 'SLA ✓' },
    { title: 'Teams onboard', value: 327, suffix: '+', spark: SPARKS.teams, delta: '+38 tuần này' },
    { title: 'Avg. MTTR', value: 26, suffix: ' phút', spark: SPARKS.mttr, delta: '−8 phút' },
  ];
  return (
    <section aria-label="Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((m, i) => (
        <Reveal key={m.title} direction="up" delay={i * 90}>
          <Card className="h-full">
            <div className="flex items-start justify-between gap-2">
              <Statistic
                title={m.title}
                value={<CountUp value={m.value} decimals={m.decimals ?? 0} />}
                suffix={m.suffix}
              />
              <Chart config={sparkConfig(m.spark.points, m.spark.color)} height={44} className="w-24 shrink-0" />
            </div>
            <div className="mt-2 text-meta text-st-done">{m.delta}</div>
          </Card>
        </Reveal>
      ))}
    </section>
  );
}

/** Features — 6 card grid + 1 card featured span-2 (hover lift + Reveal stagger). */
function FeaturesGrid() {
  return (
    <section className="flex flex-col gap-5">
      <Title level={2} style={{ marginBottom: 0 }} className="text-center">
        Everything the workflow needs
      </Title>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Featured card span-2 — mở đầu grid */}
        <Reveal direction="up" className="sm:col-span-2">
          <Card hoverable className="h-full bg-gradient-to-br from-accent/10 to-transparent">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span aria-hidden="true" className="mb-3 grid size-10 place-items-center rounded-lg bg-accent text-white">
                  <Icon name="menu-bars" size={18} />
                </span>
                <div className="text-body font-medium text-ink">One board to rule the sprint</div>
                <p className="m-0 mt-1 text-meta text-ink3">
                  Kanban WIP-limit, saga auto-assign, DLQ badge — kéo thẻ và xem toàn bộ
                  pipeline phản hồi tức thì.
                </p>
              </div>
              <Tag>featured</Tag>
            </div>
          </Card>
        </Reveal>
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} direction="up" delay={(i % 3) * 120}>
            <Card hoverable className="h-full">
              <span aria-hidden="true" className="mb-3 grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon name={f.icon} size={18} />
              </span>
              <div className="text-body font-medium text-ink">{f.title}</div>
              <p className="m-0 mt-1 text-meta text-ink3">{f.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Pricing — Segmented monthly/yearly; giá CountUp replay khi đổi kỳ. */
function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const plans = PLANS[billing as keyof typeof PLANS];
  return (
    <section className="flex flex-col items-center gap-5">
      <Title level={2} style={{ marginBottom: 0 }}>
        Pricing that scales down
      </Title>
      <Segmented
        value={billing}
        onChange={setBilling}
        options={[
          { label: 'Monthly', value: 'monthly' },
          { label: 'Yearly — save 2 months', value: 'yearly' },
        ]}
      />
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            hoverable
            className={plan.featured ? 'border-accent' : undefined}
            title={
              <span className="flex items-center gap-2">
                {plan.name}
                {plan.featured && <Tag>most popular</Tag>}
              </span>
            }
          >
            <div className="flex items-baseline gap-1">
              {/* key đổi theo billing → CountUp animate lại từ 0, cảm giác "giá vừa tính xong" */}
              <span className="text-3xl font-semibold tabular-nums text-ink">
                $<CountUp key={billing} value={plan.price} />
              </span>
              <span className="text-meta text-ink3">/ seat / {billing === 'monthly' ? 'mo' : 'mo, billed yearly'}</span>
            </div>
            <div className="mt-1 text-meta text-ink3">{plan.blurb}</div>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-body text-ink2">
                  <Icon name="check" size={12} className="text-st-done" />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <Button type={plan.featured ? 'primary' : 'default'} block>
                {plan.price === 0 ? 'Start free' : `Choose ${plan.name}`}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** SHOWCASE split — ảnh Parallax trái + floating UI chips trôi phải (Badge/Tag/mini-card). */
function ShowcaseSplit() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
      <div className="relative order-2 overflow-hidden rounded-xl border border-line shadow-lift lg:order-1">
        <Parallax speed={0.2} scale>
          <img
            src={photo('orca-showcase-sprint', 900, 620)}
            alt="Sprint board với thẻ kéo thả (picsum seed: orca-showcase-sprint)"
            className="aspect-[10/7] w-full object-cover"
          />
        </Parallax>
        {/* Floating chips — Parallax tốc độ khác → trôi lệch nhịp trên ảnh */}
        <Parallax speed={0.45} className="absolute -right-2 top-6 z-10">
          <Badge status="success" text="deploy passed · 2s ago" />
        </Parallax>
        <Parallax speed={0.32} className="absolute -left-3 bottom-10 z-10">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-s1 px-3 py-2 shadow-lift">
            <Avatar size={22}>AL</Avatar>
            <span className="text-label text-ink">Alice đã gán Task #108 cho Hội</span>
            <Tag>saga</Tag>
          </span>
        </Parallax>
        <Parallax speed={0.55} className="absolute right-6 bottom-24 z-10">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-s2 px-3 py-2 shadow-lift">
            <Icon name="clock" size={12} className="text-accent" />
            <span className="text-label tabular-nums text-ink">p99 412ms</span>
          </span>
        </Parallax>
      </div>
      <div className="order-1 flex flex-col gap-4 lg:order-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-accent">showcase</span>
        <Title level={2} style={{ marginBottom: 0 }}>
          Mọi chuyển động đều báo hiệu một sự kiện thật
        </Title>
        <Text type="secondary" className="text-body">
          Chip “deploy passed” xuất hiện vì một build đã xong. Chip saga trôi lên vì một
          task vừa được gán. Landing không trang trí — nó chạy cùng hệ thống.
        </Text>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {['Kafka events render UI trực tiếp', 'Outbox đảm bảo không mất thông báo', 'Saga fail bôi đỏ — recovery nhìn thấy'].map(
            (item) => (
              <li key={item} className="flex items-center gap-2 text-body text-ink2">
                <Icon name="check" size={12} className="text-st-done" />
                {item}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}

/** SO SÁNH ngắn — 3 hàng × 3 gói (check/—). */
function PricingCompare() {
  const rows: Array<[string, boolean, boolean, boolean]> = [
    ['Unlimited projects', false, true, true],
    ['Real-time activity feed', false, true, true],
    ['SSO + audit log', false, false, true],
    ['SLA 99.95%', false, false, true],
  ];
  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <div className="grid grid-cols-4 items-center gap-2 rounded-xl border border-line bg-s1 px-4 py-3 text-label text-ink2">
        <span />
        <span className="text-center font-bold text-ink">Start</span>
        <span className="text-center font-bold text-ink">Pro</span>
        <span className="text-center font-bold text-ink">Enterprise</span>
        {rows.map(([label, pro, ent]) => (
          <div key={label} className="col-span-4 grid grid-cols-4 items-center gap-2 border-t border-line2 py-2 text-body">
            <span className="col-span-4 text-ink2 md:col-span-1">{label}</span>
            <span className="hidden md:block" />
            <span className="text-center">{pro ? <Icon name="check" size={14} className="text-st-done" /> : <span className="text-ink3">—</span>}</span>
            <span className="text-center">{ent ? <Icon name="check" size={14} className="text-st-done" /> : <span className="text-ink3">—</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** FAQ — Collapse accordion (R10: accordion single). */
function FaqSection() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-16">
      <Title level={2} style={{ marginBottom: 0 }} className="text-center">
        Frequently asked
      </Title>
      <Collapse
        accordion
        items={FAQS.map((f) => ({ key: f.q, label: f.q, children: f.a }))}
      />
    </section>
  );
}

/** CTA cuối — glow accent radial + nút lớn. */
function FinalCtaGlow() {
  return (
    <section className="relative mx-auto my-10 max-w-5xl overflow-hidden rounded-xl border border-line px-6 py-20 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 68%)', filter: 'blur(12px)' }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Title level={2} style={{ marginBottom: 0 }}>
          Ready in four minutes
        </Title>
        <Text type="secondary">Scaffold a workspace, invite the team, ship the first board today.</Text>
        <Button type="primary" size="large">
          Create your workspace
        </Button>
        <span className="text-meta text-ink3">No credit card — Start plan is free forever.</span>
      </div>
    </section>
  );
}

/** Testimonials — Carousel indicators mới: 3 quote slide, keyboard + indicators. */
function Testimonials() {
  return (
    <section className="flex flex-col gap-5">
      <Title level={2} style={{ marginBottom: 0 }} className="text-center">
        Teams talk, numbers back it up
      </Title>
      <Carousel
        items={QUOTES.map((q) => (
          <figure key={q.name} className="m-0 flex flex-col gap-4 rounded-xl border border-line bg-s1 p-8">
            <blockquote className="m-0 text-[17px] leading-relaxed text-ink">“{q.quote}”</blockquote>
            <figcaption className="flex items-center gap-3">
              <Avatar size={32}>{q.initials}</Avatar>
              <div className="text-left">
                <div className="text-label font-bold text-ink">{q.name}</div>
                <div className="text-meta text-ink3">{q.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
        indicators
        navigators
        keyboard
        circular
        className="mx-auto max-w-3xl"
      />
    </section>
  );
}

/** CTA cuối + footer — Divider + brand + cột link text-meta. */
function FinalCta() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-line bg-s1 p-8 text-center">
      <Title level={2} style={{ marginBottom: 0 }}>
        Ready in four minutes
      </Title>
      <Text type="secondary">Scaffold a workspace, invite the team, ship the first board today.</Text>
      <Button type="primary" size="large">
        Create your workspace
      </Button>
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-4">
      <Divider />
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {(
          [
            ['Product', ['Features', 'Pricing', 'Changelog']],
            ['Resources', ['Docs', 'Recipes', 'Storybook']],
            ['Company', ['About', 'Blog', 'Careers']],
            ['Legal', ['Privacy', 'Terms', 'Security']],
          ] as const
        ).map(([head, links]) => (
          <div key={head} className="flex flex-col gap-1.5">
            <div className="text-label font-medium text-ink">{head}</div>
            {links.map((l) => (
              <span key={l} className="text-meta text-ink3">
                {l}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="text-meta text-ink3">© 2026 Wakii — built with @wakii/ui-kit, tokens all the way down.</div>
    </footer>
  );
}

/** Landing — trang đầy đủ: hero → stats → features → pricing → testimonials → CTA → footer. */
export const Landing: Story = {
  name: 'Landing — full page (hero → stats → features → pricing → quotes → CTA)',
  render: () => (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 pb-6">
      <Hero />
      <MetricsBand />
      <FeaturesGrid />
      <Pricing />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  ),
};

/** LandingMinimal — chỉ hero + stats + CTA + footer (variant dựng nhanh). */
export const LandingMinimal: Story = {
  name: 'Minimal — hero + stats + CTA + footer',
  render: () => (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 pb-6">
      <Hero />
      <MetricsBand />
      <FinalCta />
      <Footer />
    </div>
  ),
};
