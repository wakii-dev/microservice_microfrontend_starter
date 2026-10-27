// Landing — 1 trang duy nhất dogfooding motion của @wakii/ui-kit (recipes 16-17
// docs/ai/recipes.md): hero gradient/blob trôi Parallax · KPI Statistic+CountUp
// Reveal stagger · feature cards hiện dần (direction up/left/right, delay
// 0/150/300) · FAQ thu/mở CollapseTransition · closer CTA + footer.
// Header sticky + logo W + dark toggle copy pattern template-feats/router —
// KHÔNG router (1 trang): nav là anchor link trong trang.
// Tokens-only theo AGENTS.md ui-kit: không hex, motion dùng keyframe sẵn
// (bp-slide-up-in…), reduced-motion tự tắt nhờ block global của kit.
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  CountUp,
  Icon,
  Link,
  Parallax,
  Reveal,
  Row,
  Statistic,
  Tag,
  Text,
  Title,
  CollapseTransition,
} from '@wakii/ui-kit';
import { useAppTheme } from './theme';

/* Sun/moon inline SVG — copy shell NavBar (icon set của kit chưa có sun/moon). */
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Active nav — gạch accent 2px dưới qua aria-current (copy pattern shell NavBar). */
const NAV_LINK =
  "relative flex items-center rounded-2 px-2.5 text-label no-underline text-ink2 transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:bottom-0 aria-[current=page]:after:left-2 aria-[current=page]:after:right-2 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-[1px] aria-[current=page]:after:bg-accent aria-[current=page]:after:content-['']";

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

/** Cuộn tới section theo id — respect prefers-reduced-motion (scrollIntoView
 * smooth là JS motion, không nằm trong block global của kit nên tự xử lý). */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

interface Feature {
  id: string;
  icon: 'check-circle' | 'star' | 'users';
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    id: 'tokens',
    icon: 'check-circle',
    title: 'Tokens-first theming',
    body: 'Every color, radius and shadow is a CSS token — flip data-bp-theme to dark and the whole page cascades, zero per-component code.',
  },
  {
    id: 'motion',
    icon: 'star',
    title: 'Motion built in',
    body: 'Reveal on scroll, CountUp metrics, Parallax depth and Collapse panels — all zero-dep, GPU-friendly and reduced-motion aware by default.',
  },
  {
    id: 'components',
    icon: 'users',
    title: '90+ components',
    body: 'From Buttons to Tables to Kanban boards — one npm package, Tailwind v4 utilities, dark mode and Storybook docs included.',
  },
];

interface Faq {
  question: string;
  answer: string;
}

const FAQS: Faq[] = [
  {
    question: 'Is the motion accessible?',
    answer:
      'Yes — Reveal, CountUp, Parallax and CollapseTransition all drop to their final state when the visitor prefers reduced motion. The global block in the kit handles it; no branch in your code.',
  },
  {
    question: 'Can I edit the sections freely?',
    answer:
      'This is a plain React component tree — hero, KPI, features, FAQ and closer are sections of one page. Delete, reorder or duplicate them and keep the kit imports you need.',
  },
  {
    question: 'How do I add routing later?',
    answer:
      'The page is intentionally router-free. Add react-router and wrap App in a BrowserRouter in src/main.tsx when the landing grows into a multi-page site.',
  },
];

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={EYEBROW}>{eyebrow}</span>
      <Title level={3}>{title}</Title>
      {description ? (
        <div className="max-w-2xl">
          <Text type="secondary">{description}</Text>
        </div>
      ) : null}
    </div>
  );
}

/* FAQ item — nút trigger + panel thu/mở CollapseTransition. Padding đặt SẶC
 * trong children (tầng overflow-hidden của transition phải clip sạch). */
function FaqItem({ faq, open, onToggle }: { faq: Faq; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-s1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border-none bg-transparent px-5 py-4 text-left text-body font-medium text-ink transition-colors hover:bg-s2 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        {faq.question}
        <Icon
          name="chevron-down"
          size={16}
          className={`shrink-0 text-ink2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <CollapseTransition in={open}>
        <div className="px-5 pb-4">
          <Text type="secondary">{faq.answer}</Text>
        </div>
      </CollapseTransition>
    </div>
  );
}

export function App() {
  const { theme, setTheme } = useAppTheme();
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Header sticky — copy pattern template-feats/router (blur + logo W + dark toggle) */}
      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-line bg-s1/80 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6">
          <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
              {/* Logo mark "W" (wakii) — brand riêng của app scaffold, bộ Icon
                  chưa có glyph logo (precedent Sun/Moon icon ở trên). */}
              <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M1.5 3l2.2 6L6 5.2 8.3 9l2.2-6" />
              </svg>
            </span>
            {'{{appName}}'}
          </span>
          <span aria-hidden="true" className="h-[18px] w-px shrink-0 self-center bg-line max-md:hidden" />
          <nav aria-label="Main navigation" className="flex flex-wrap gap-0.5">
            <a className={NAV_LINK} href="#features">
              Features
            </a>
            <a className={NAV_LINK} href="#numbers">
              Numbers
            </a>
            <a className={NAV_LINK} href="#faq">
              FAQ
            </a>
          </nav>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Turn off dark mode' : 'Turn on dark mode'}
              className="cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 transition-colors hover:bg-s3"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12">
        {/* Hero — panel gradient/blob trôi Parallax (recipe 16: speed 0.3 + scale) */}
        <section className="flex flex-col gap-6">
          <Parallax speed={0.3} scale className="overflow-hidden rounded-xl">
            <div className="relative flex flex-col gap-5 bg-s1 px-6 py-14 shadow-[var(--shadow-lift)] max-sm:px-5 sm:px-10">
              {/* Blob accent trang trí — token + opacity, không hex (rule 1) */}
              <span aria-hidden="true" className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-pill bg-accent/20 blur-3xl" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-pill bg-accent/10 blur-3xl" />
              <span className="flex w-fit items-center gap-2 rounded-pill border border-line bg-s2 px-3 py-1 text-label text-ink2">
                <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />
                @wakii/ui-kit — tokens, dark mode &amp; motion
              </span>
              <Title level={1}>
                {'{{appName}}'} — <span className="text-accent">a landing that moves</span>, without the motion work.
              </Title>
              <div className="max-w-2xl">
                <Text type="secondary">
                  One page, every motion primitive of the kit: scroll reveals, counting metrics, parallax depth and
                  collapsible panels — tokens-only, dark-mode ready, reduced-motion safe. Edit{' '}
                  <Text code>src/App.tsx</Text> and make it yours.
                </Text>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button type="primary" size="large" onClick={() => scrollToSection('features')}>
                  <span className="flex items-center gap-1.5">
                    Explore features <Icon name="arrow-right" size={14} />
                  </span>
                </Button>
                <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
                  Open Storybook
                </Link>
              </div>
            </div>
          </Parallax>

          {/* KPI — Statistic + CountUp, thẻ trôi vào lệch pha Reveal 0/150/300 (recipe 16) */}
          <Row gutter={[24, 24]}>
            {[
              { title: 'Kit components', value: 90, suffix: '+' },
              { title: 'Hooks & utils', value: 28, suffix: '' },
              { title: 'Storybook stories', value: 683, suffix: '' },
            ].map((kpi, i) => (
              <Col key={kpi.title} xs={24} md={8}>
                <Reveal direction="up" delay={i * 150}>
                  <div className="h-full rounded-xl border border-line bg-s1 px-6 py-5 shadow-[var(--shadow-lift)]">
                    <Statistic title={kpi.title} value={<CountUp value={kpi.value} />} suffix={kpi.suffix || undefined} />
                  </div>
                </Reveal>
              </Col>
            ))}
          </Row>
        </section>

        {/* Features — 3 card hiện dần: direction up/left/right phân biệt + delay 0/150/300 */}
        <Reveal>
          <section id="features" className="flex scroll-mt-20 flex-col gap-6">
            <SectionHeader
              eyebrow="Features"
              title="Everything a landing needs"
              description="Three cards revealing from different directions — the stagger makes the page feel alive without a single line of animation code."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.id} direction={i === 0 ? 'up' : i === 1 ? 'left' : 'right'} delay={i * 150}>
                  <Card
                    className="h-full"
                    title={
                      <span className="flex items-center gap-2">
                        <Icon name={feature.icon} size={16} className="text-accent" />
                        {feature.title}
                      </span>
                    }
                  >
                    <Text type="secondary">{feature.body}</Text>
                  </Card>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>

        {/* FAQ — thu/mở CollapseTransition (recipe 17: grid-rows 0fr↔1fr) */}
        <Reveal>
          <section id="faq" className="flex scroll-mt-20 flex-col gap-6">
            <SectionHeader eyebrow="FAQ" title="Questions, collapsed" />
            <Alert
              type="info"
              variant="outlined"
              message="All motion on this page respects prefers-reduced-motion — visitors with the setting see everything appear instantly."
            />
            <div className="flex flex-col gap-2">
              {FAQS.map((faq, i) => (
                <FaqItem
                  key={faq.question}
                  faq={faq}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq((current) => (current === i ? -1 : i))}
                />
              ))}
            </div>
          </section>
        </Reveal>

        {/* Closer CTA — band nét đứt + 2 lối ra */}
        <Reveal>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line px-6 py-6">
            <div className="flex flex-col gap-1.5">
              <Title level={4}>Ready to ship your own?</Title>
              <Text type="secondary">
                Start from <Text code>src/App.tsx</Text> — the kit has 90+ components waiting.
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Tag>react 19</Tag>
              <Tag>tailwind v4</Tag>
              <Link href="https://www.npmjs.com/package/@wakii/ui-kit" target="_blank" rel="noreferrer">
                @wakii/ui-kit on npm
              </Link>
            </div>
          </section>
        </Reveal>
      </main>

      {/* Footer — copy pattern template-feats/router */}
      <footer className="mt-auto border-t border-line bg-s1">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-label text-ink3">
          <span>
            Built with <Text strong>@wakii/ui-kit</Text> — {'{{appName}}'}
          </span>
          <div className="flex items-center gap-4">
            <Link href="https://www.npmjs.com/package/@wakii/ui-kit" target="_blank" rel="noreferrer">
              npm
            </Link>
            <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
              Storybook
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
