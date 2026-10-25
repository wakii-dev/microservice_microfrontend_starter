// Overlay ROUTER (react-router v7) — engine COPY file này đè lên src/App.tsx khi
// user chọn router, thêm dep `react-router` vào package.json, và BỌC
// <BrowserRouter> trong src/main.tsx (spec overlay: main bọc BrowserRouter).
// ⚠️ Import './theme' viết theo VỊ TRÍ ĐÍCH (src/) — không phải vị trí file này.
// 3 marker EXTRA_IMPORTS / EXTRA_LINKS / EXTRA_ROUTES (trong ngoặc {{ }}) —
// engine chèn import/nav/route của demo extras khi user chọn; không extra nào
// → thay rỗng. Chỉ đặt đúng 1 marker mỗi loại, KHÔNG nhắc nguyên văn trong
// comment (engine replaceAll toàn file).
// Khác bản base: Routes "/" demo dogfooding và "/about" giới thiệu kit.
// Redesign 2026-10-25: hero card blob accent + KPI CountUp trong Reveal +
// sections Interactive/Feedback/Data + footer mới; NavLink active gạch accent
// (pattern shell NavBar); theme toggle cascade qua data-bp-theme. Tokens-only
// theo AGENTS.md ui-kit.
import { useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router';
import {
  Alert,
  Button,
  Card,
  CountUp,
  Icon,
  Link,
  Reveal,
  Statistic,
  Table,
  Tag,
  Text,
  Title,
  type TableColumn,
} from '@wakii/ui-kit';
import { useAppTheme } from './theme';
{{EXTRA_IMPORTS}}

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

interface TaskRow {
  id: number;
  task: string;
  owner: string;
  status: string;
  due: string;
}

const TASK_ROWS: TaskRow[] = [
  { id: 1, task: 'Scaffold the app', owner: 'You', status: 'done', due: 'Mon' },
  { id: 2, task: 'Pick a design direction', owner: 'Design', status: 'in progress', due: 'Tue' },
  { id: 3, task: 'Wire up the first page', owner: 'You', status: 'in progress', due: 'Wed' },
  { id: 4, task: 'Invite the team', owner: 'Ops', status: 'todo', due: 'Fri' },
  { id: 5, task: 'Ship to production', owner: 'You', status: 'todo', due: 'Next week' },
];

const TASK_COLUMNS: TableColumn<TaskRow>[] = [
  { key: 'task', title: 'Task' },
  { key: 'owner', title: 'Owner' },
  { key: 'status', title: 'Status', render: (row: TaskRow) => <Tag>{row.status}</Tag> },
  { key: 'due', title: 'Due', render: (row: TaskRow) => <Text type="secondary">{row.due}</Text> },
];

const STARTER_TAGS = ['design tokens', 'dark mode', 'motion'];

function HomePage() {
  const [claps, setClaps] = useState(0);
  const [tags, setTags] = useState(STARTER_TAGS);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-16">
      {/* Hero — card nền s1 + blob accent trang trí */}
      <section className="relative flex flex-col gap-5 overflow-hidden rounded-xl border border-line bg-s1 px-6 py-12 shadow-[var(--shadow-lift)] animate-[bp-slide-up-in_500ms_var(--ease-enter)_both] max-sm:px-5 sm:px-10">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 size-80 rounded-pill bg-accent/20 blur-3xl"
        />
        <span className="flex w-fit items-center gap-2 rounded-pill border border-line bg-s2 px-3 py-1 text-label text-ink2">
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />
          @wakii/ui-kit — tokens, dark mode &amp; motion
        </span>
        <Title level={1}>
          Welcome to {'{{appName}}'} — <span className="text-accent">ship beautiful UI</span>, fast.
        </Title>
        <div className="max-w-2xl">
          <Text type="secondary">
            This starter is wired with the full kit: design tokens, 90+ components, dark theme and motion, styled
            with Tailwind v4 utilities. Edit <Text code>src/App.tsx</Text> and make it yours.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Button type="primary" size="large" onClick={() => navigate('/about')}>
            <span className="flex items-center gap-1.5">
              Explore the kit <Icon name="arrow-right" size={14} />
            </span>
          </Button>
          <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
            Open Storybook
          </Link>
        </div>
      </section>

      {/* KPI — đếm số khi vào viewport */}
      <Reveal>
        <div className="grid grid-cols-3 gap-8 rounded-xl border border-line bg-s1 px-8 py-6 shadow-[var(--shadow-lift)] max-sm:grid-cols-1 max-sm:gap-6">
          <Statistic title="Kit components" value={<CountUp value={90} />} suffix="+" />
          <Statistic title="Hooks & utils" value={<CountUp value={28} />} />
          <Statistic title="Storybook stories" value={<CountUp value={683} />} />
        </div>
      </Reveal>

      {/* Interactive */}
      <Reveal>
        <section className="flex flex-col gap-4">
          <SectionHeader
            eyebrow="Interactive"
            title="Buttons & tags"
            description="State demos wired to real interactions — clap away."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Clap counter">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="primary" onClick={() => setClaps((c) => c + 1)}>
                    Clap
                  </Button>
                  <Button onClick={() => setClaps((c) => Math.max(0, c - 1))}>Undo</Button>
                  <Button type="text" onClick={() => setClaps(0)}>
                    Reset
                  </Button>
                </div>
                <Text type="secondary">
                  {claps} clap{claps === 1 ? '' : 's'} so far
                </Text>
              </div>
            </Card>
            <Card title="Removable tags">
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <Tag key={tag} closable onClose={() => setTags((t) => t.filter((x) => x !== tag))}>
                    {tag}
                  </Tag>
                ))}
                {tags.length === 0 && <Text type="secondary">All tags removed — they come back on reload.</Text>}
              </div>
            </Card>
          </div>
        </section>
      </Reveal>

      {/* Feedback */}
      <Reveal>
        <section className="flex flex-col gap-4">
          <SectionHeader
            eyebrow="Feedback"
            title="Alerts"
            description="Four severities, filled by default — outlined variant available."
          />
          <div className="flex flex-col gap-2">
            <Alert type="success" message="Setup complete — tokens, dark theme and Tailwind utilities are wired." />
            <Alert
              type="info"
              message="Press the sun/moon toggle — data-bp-theme cascades through CSS tokens, no reload."
            />
            <Alert
              type="warning"
              message="Keep the @source lines in src/styles.css — kit utilities are scanned from node_modules."
            />
            <Alert type="error" message="Error alerts look like this — filled variant by default." />
          </div>
        </section>
      </Reveal>

      {/* Data */}
      <Reveal>
        <section className="flex flex-col gap-4">
          <SectionHeader
            eyebrow="Data"
            title="Sprint backlog"
            description="Table with tags and status pills — sortable headers included."
          />
          <Card>
            <Table columns={TASK_COLUMNS} dataSource={TASK_ROWS} rowKey="id" />
          </Card>
        </section>
      </Reveal>

      {/* Closer — next steps */}
      <Reveal>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line px-6 py-5">
          <Text type="secondary">
            Ready to build? Start editing <Text code>src/App.tsx</Text> — the kit has 90+ components waiting.
          </Text>
          <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
            Browse Storybook
          </Link>
        </section>
      </Reveal>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>About</span>
        <Title level={1}>A design system that scales with you</Title>
      </div>
      <div className="max-w-2xl">
        <Text type="secondary">
          <Text strong>@wakii/ui-kit</Text> is a Tailwind v4 design system: tokens-first theming (light/dark qua
          <Text code> data-bp-theme</Text>), antd/PrimeReact-parity components, hooks and motion — shipped as one
          npm package.
        </Text>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Storybook" extra={<Tag>live</Tag>}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">Every component with knobs and docs — the living API reference.</Text>
            <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
              Open the playground
            </Link>
          </div>
        </Card>
        <Card title="npm package" extra={<Tag>latest</Tag>}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">Install the kit in any Vite/React app and consume it via source.</Text>
            <Link href="https://www.npmjs.com/package/@wakii/ui-kit" target="_blank" rel="noreferrer">
              @wakii/ui-kit on npm
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function App() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-line bg-s1/80 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6">
          <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
              <Icon name="menu-bars" size={12} className="text-white" />
            </span>
            {'{{appName}}'}
          </span>
          <span aria-hidden="true" className="h-[18px] w-px shrink-0 self-center bg-line max-md:hidden" />
          <nav aria-label="Main navigation" className="flex flex-wrap gap-0.5">
            <NavLink className={NAV_LINK} end to="/">
              Home
            </NavLink>
            <NavLink className={NAV_LINK} to="/about">
              About
            </NavLink>
            {{EXTRA_LINKS}}
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
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<AboutPage />} path="/about" />
          {{EXTRA_ROUTES}}
        </Routes>
      </main>

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
