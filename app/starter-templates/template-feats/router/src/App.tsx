// Overlay ROUTER (react-router v7) — engine COPY file này đè lên src/App.tsx khi
// user chọn router, thêm dep `react-router` vào package.json, và BỌC
// <BrowserRouter> trong src/main.tsx (spec overlay: main bọc BrowserRouter).
// ⚠️ Import './theme' viết theo VỊ TRÍ ĐÍCH (src/) — không phải vị trí file này.
// Khác bản base: NavBar thêm NavLink (/ + /about — active gạch accent 2px, pattern
// shell NavBar) + Routes "/" demo dogfooding và "/about" giới thiệu kit.
import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router';
import {
  Alert,
  Button,
  Card,
  CountUp,
  Icon,
  Link,
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

interface TaskRow {
  id: number;
  task: string;
  owner: string;
  status: string;
}

const TASK_ROWS: TaskRow[] = [
  { id: 1, task: 'Scaffold the app', owner: 'You', status: 'done' },
  { id: 2, task: 'Pick a design direction', owner: 'Design', status: 'in progress' },
  { id: 3, task: 'Wire up the first page', owner: 'You', status: 'in progress' },
  { id: 4, task: 'Invite the team', owner: 'Ops', status: 'todo' },
  { id: 5, task: 'Ship to production', owner: 'You', status: 'todo' },
];

const TASK_COLUMNS: TableColumn<TaskRow>[] = [
  { key: 'task', title: 'Task' },
  { key: 'owner', title: 'Owner' },
  { key: 'status', title: 'Status', render: (row: TaskRow) => <Tag>{row.status}</Tag> },
];

const STARTER_TAGS = ['design tokens', 'dark mode', 'motion'];

function HomePage() {
  const [claps, setClaps] = useState(0);
  const [tags, setTags] = useState(STARTER_TAGS);

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="flex flex-col gap-2">
        <Title level={1}>Welcome to {'{{appName}}'}</Title>
        <Text type="secondary">
          Built with <Text strong>@wakii/ui-kit</Text> — design tokens, 90+ components, dark theme and motion,
          styled with Tailwind v4 utilities.
        </Text>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {tags.map((tag) => (
            <Tag key={tag} closable onClose={() => setTags((t) => t.filter((x) => x !== tag))}>
              {tag}
            </Tag>
          ))}
          {tags.length === 0 && <Text type="secondary">All tags removed — they come back on reload.</Text>}
        </div>
      </section>

      {/* Buttons — 3 kiểu + đếm tương tác thật */}
      <section className="flex flex-col gap-3">
        <Title level={3}>Buttons</Title>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="primary" onClick={() => setClaps((c) => c + 1)}>
            Clap
          </Button>
          <Button onClick={() => setClaps((c) => Math.max(0, c - 1))}>Undo</Button>
          <Button type="text" onClick={() => setClaps(0)}>
            Reset
          </Button>
          <Text type="secondary">
            {claps} clap{claps === 1 ? '' : 's'}
          </Text>
        </div>
      </section>

      {/* Alerts — 4 type */}
      <section className="flex flex-col gap-3">
        <Title level={3}>Alerts</Title>
        <div className="flex flex-col gap-2">
          <Alert type="success" message="Setup complete — tokens, dark theme and Tailwind utilities are wired." />
          <Alert
            type="info"
            message="Press the sun/moon toggle — data-bp-theme cascades through CSS tokens, no reload."
          />
          <Alert
            type="warning"
            message="Keep the @source line in src/styles.css — kit utilities are scanned from node_modules."
          />
          <Alert type="error" message="Error alerts look like this — filled variant by default." />
        </div>
      </section>

      {/* Table — 3 cột, 5 hàng */}
      <section className="flex flex-col gap-3">
        <Title level={3}>Table</Title>
        <Table columns={TASK_COLUMNS} dataSource={TASK_ROWS} rowKey="id" />
      </section>

      {/* Statistic + CountUp */}
      <section className="flex flex-col gap-3">
        <Title level={3}>By the numbers</Title>
        <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          <Statistic title="Kit components" value={<CountUp value={90} />} suffix="+" />
          <Statistic title="Hooks & utils" value={<CountUp value={28} />} />
          <Statistic title="Storybook stories" value={<CountUp value={683} />} />
        </div>
      </section>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="flex flex-col gap-4">
      <Title level={1}>About the kit</Title>
      <Text>
        <Text strong>@wakii/ui-kit</Text> is a Tailwind v4 design system: tokens-first theming (light/dark qua
        <Text code> data-bp-theme</Text>), antd/PrimeReact-parity components, hooks and motion — shipped as one
        npm package.
      </Text>
      <Card title="Links" extra={<Tag>v0.4.0</Tag>}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-body">
          <li>
            <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
              Storybook — live component playground
            </Link>
          </li>
          <li>
            <Link href="https://www.npmjs.com/package/@wakii/ui-kit" target="_blank" rel="noreferrer">
              npm — @wakii/ui-kit package
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}

export function App() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="flex min-h-[52px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-s1 px-4 py-2">
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
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<AboutPage />} path="/about" />
          {{EXTRA_ROUTES}}
        </Routes>
      </main>
    </div>
  );
}
