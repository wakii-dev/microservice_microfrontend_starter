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
import { Button } from '../ui/button/index';
import { Card } from '../ui/card/index';
import { CountUp } from '../ui/count-up/index';
import { Divider } from '../ui/divider/index';
import { Icon, type IconName } from '../ui/icons/index.js';
import { Parallax } from '../ui/parallax/index';
import { Reveal } from '../ui/reveal/index';
import { Segmented } from '../ui/segmented/index';
import { Statistic } from '../ui/statistic/index';
import { Tag } from '../ui/tag/index';
import { Text, Title } from '../ui/typography/index';

const meta = { title: 'Templates/Landing', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

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

/** Hero — Tag + Title + Text + CTA; ảnh drift chậm hơn trang (Parallax). */
function Hero({ onCta }: { onCta?: () => void }) {
  return (
    <section className="flex flex-col items-center gap-5 pt-8 text-center">
      <Tag icon={<Icon name="check-circle" size={12} />}>v1.0 — production ready</Tag>
      <Title level={1} style={{ marginBottom: 0 }} className="max-w-2xl">
        Ship work, not tooling
      </Title>
      <Text type="secondary" className="max-w-xl text-body">
        A task platform assembled from one design system — dashboards, boards and landing pages that
        all speak the same token language.
      </Text>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="primary" size="large" onClick={onCta} className="whitespace-nowrap">
          Get started free
        </Button>
        <Button size="large" icon={<Icon name="external-link" size={14} />} className="whitespace-nowrap">
          Read the docs
        </Button>
      </div>
      <Parallax speed={0.25} scale className="mt-4 w-full overflow-hidden rounded-xl">
        <img
          src={photo('orca-landing-hero', 1280, 640)}
          alt="Product hero — team workspace overview (picsum seed: orca-landing-hero)"
          className="aspect-[2/1] w-full object-cover"
        />
      </Parallax>
    </section>
  );
}

/** Stats strip — 4 KPI, số đếm ease-out (CountUp) trong Statistic. */
function StatsStrip() {
  return (
    <section className="grid grid-cols-2 gap-6 rounded-xl border border-line bg-s1 p-6 sm:grid-cols-4">
      <Statistic title="Tasks shipped" value={<CountUp value={128} />} suffix="k" />
      <Statistic title="Uptime" value={<CountUp value={99.95} decimals={2} />} suffix="%" />
      <Statistic title="Teams onboard" value={<CountUp value={327} />} suffix="+" />
      <Statistic title="Avg. setup time" value={<CountUp value={4} decimals={0} duration={0.8} />} suffix=" min" />
    </section>
  );
}

/** Features grid — 6 Card, Reveal stagger 0/120/240ms theo hàng. */
function FeaturesGrid() {
  return (
    <section className="flex flex-col gap-5">
      <Title level={2} style={{ marginBottom: 0 }} className="text-center">
        Everything the workflow needs
      </Title>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} direction="up" delay={(i % 3) * 120}>
            <Card className="h-full">
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

/** Testimonials — 3 quote, Avatar chữ cái đầu + Divider phân cách. */
function Testimonials() {
  return (
    <section className="flex flex-col gap-5">
      <Title level={2} style={{ marginBottom: 0 }} className="text-center">
        Teams talk, numbers back it up
      </Title>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {QUOTES.map((q) => (
          <Reveal key={q.name} direction="up">
            <figure className="m-0 flex h-full flex-col gap-3 rounded-xl border border-line bg-s1 p-4">
              <blockquote className="m-0 text-body text-ink2">“{q.quote}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-2">
                <Avatar size={28}>{q.initials}</Avatar>
                <div>
                  <div className="text-label font-medium text-ink">{q.name}</div>
                  <div className="text-meta text-ink3">{q.role}</div>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      <Divider dashed>loved by builders</Divider>
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
      <StatsStrip />
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
      <StatsStrip />
      <FinalCta />
      <Footer />
    </div>
  ),
};
