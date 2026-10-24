// App demo — dogfooding @wakii/ui-kit trên 1 trang: NavBar tối giản (brand +
// dark toggle) + Title/Text/Tag · 3 Button · Alert 4 type · Table · Statistic
// CountUp · Card "What's inside". Bản react-router v7 (2 route + /about) nằm ở
// overlay template-feats/router/App.tsx — CLI đổi file này khi chọn router.
import { useState } from 'react';
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

export function App() {
  const { theme, setTheme } = useAppTheme();
  const [claps, setClaps] = useState(0);
  const [tags, setTags] = useState(STARTER_TAGS);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* NavBar tối giản — copy pattern shell NavBar: brand + dark toggle */}
      <header className="flex min-h-[52px] items-center gap-x-4 border-b border-line bg-s1 px-4 py-2">
        <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
          <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
            <Icon name="menu-bars" size={12} className="text-white" />
          </span>
          {'{{appName}}'}
        </span>
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

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10">
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
            <Button onClick={() => setClaps((c) => Math.max(0, c - 1))}>
              Undo
            </Button>
            <Button type="text" onClick={() => setClaps(0)}>
              Reset
            </Button>
            <Text type="secondary">{claps} clap{claps === 1 ? '' : 's'}</Text>
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

        {/* Card — links ra kit */}
        <Card title="What's inside" extra={<Tag>@wakii/ui-kit</Tag>}>
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
          <div className="mt-3">
            <Text type="secondary">
              Remove any section above and make it yours — every component is importable from the package root.
            </Text>
          </div>
        </Card>
      </main>
    </div>
  );
}
