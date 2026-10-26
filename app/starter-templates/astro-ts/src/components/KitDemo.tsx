// KitDemo — island React render toàn bộ trang demo (client:load trong
// src/pages/index.astro): component kit chỉ chạy trong island, trang .astro tĩnh
// không render trực tiếp được. Dogfood đồng bộ brand — header W + dark toggle +
// Alert/Table/Statistic, copy pattern router feat của starter Vite.
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CountUp,
  Link,
  Statistic,
  Table,
  Tag,
  Text,
  Title,
  type TableColumn,
} from '@wakii/ui-kit';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

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

// Dark mode — cùng pattern theme.ts của starter Vite: persist localStorage
// `app-theme` + đặt data-bp-theme trên documentElement → CSS tokens cascade toàn
// trang. Astro server-render island nên đọc storage SAU mount (useEffect) để
// HTML server và lần hydrate đầu luôn khớp (đều light).
const STORAGE_KEY = 'app-theme';

function useAppTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored = raw === null ? null : (JSON.parse(raw) as 'light' | 'dark');
      if (stored === 'dark' || stored === 'light') setTheme(stored);
    } catch {
      // JSON hỏng hoặc storage bị chặn — giữ light
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bp-theme', theme);
  }, [theme]);

  const toggle = () =>
    setTheme((prev) => {
      const next = prev === 'dark' ? ('light' as const) : ('dark' as const);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // QuotaExceeded / private mode — bỏ qua, theme vẫn đổi trong phiên
      }
      return next;
    });

  return { theme, toggle };
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
  { id: 4, task: 'Ship to production', owner: 'You', status: 'todo', due: 'Fri' },
];

const TASK_COLUMNS: TableColumn<TaskRow>[] = [
  { key: 'task', title: 'Task' },
  { key: 'owner', title: 'Owner' },
  { key: 'status', title: 'Status', render: (row: TaskRow) => <Tag>{row.status}</Tag> },
  { key: 'due', title: 'Due', render: (row: TaskRow) => <Text type="secondary">{row.due}</Text> },
];

export default function KitDemo() {
  const { theme, toggle } = useAppTheme();
  const [claps, setClaps] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Header sticky — logo mark W (wakii) + tên app + dark toggle */}
      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-line bg-s1/80 backdrop-blur">
        <div className="mx-auto flex min-h-[60px] w-full max-w-5xl items-center gap-x-4 px-6">
          <span className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-ink">
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-accent">
              {/* Logo mark "W" (wakii) — brand riêng của app scaffold, bộ Icon
                  chưa có glyph logo (copy template-feats/router/src/App.tsx). */}
              <svg viewBox="0 0 12 12" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M1.5 3l2.2 6L6 5.2 8.3 9l2.2-6" />
              </svg>
            </span>
            {'{{appName}}'}
          </span>
          <div className="ml-auto">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Turn off dark mode' : 'Turn on dark mode'}
              className="cursor-pointer rounded-2 border-none bg-transparent p-1.5 text-ink2 transition-colors hover:bg-s3"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12">
        {/* Hero — giới thiệu + 2 Button */}
        <section className="flex flex-col gap-3">
          <span className={EYEBROW}>@wakii/ui-kit × Astro</span>
          <Title level={1}>
            Welcome to {'{{appName}}'} — <span className="text-accent">ship beautiful UI</span>, fast.
          </Title>
          <div className="max-w-2xl">
            <Text type="secondary">
              This starter is wired with the full kit: design tokens, dark mode and 90+ components, styled with
              Tailwind v4 utilities. Edit <Text code>src/components/KitDemo.tsx</Text> and make it yours.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="primary" onClick={() => setClaps((c) => c + 1)}>
              Clap{claps > 0 ? ` · ${claps}` : ''}
            </Button>
            <Button onClick={() => setClaps(0)}>Reset</Button>
          </div>
        </section>

        {/* KPI — CountUp trong Statistic */}
        <section className="grid grid-cols-3 gap-8 rounded-xl border border-line bg-s1 px-8 py-6 shadow-[var(--shadow-lift)] max-sm:grid-cols-1 max-sm:gap-6">
          <Statistic title="Kit components" value={<CountUp value={90} />} suffix="+" />
          <Statistic title="Hooks & utils" value={<CountUp value={28} />} />
          <Statistic title="Storybook stories" value={<CountUp value={683} />} />
        </section>

        {/* Feedback — Alert đủ 4 loại */}
        <section className="flex flex-col gap-3">
          <span className={EYEBROW}>Feedback</span>
          <Title level={3}>Alerts</Title>
          <div className="flex flex-col gap-2">
            <Alert type="success" message="Setup complete — tokens, dark theme and Tailwind utilities are wired." />
            <Alert
              type="info"
              message="Press the sun/moon toggle — data-bp-theme cascades through CSS tokens, no reload."
            />
            <Alert
              type="warning"
              message="Keep the @source lines in src/styles/global.css — kit utilities are scanned from node_modules."
            />
            <Alert type="error" message="Error alerts look like this — filled variant by default." />
          </div>
        </section>

        {/* Data — Card + Table với Tag status */}
        <section className="flex flex-col gap-3">
          <span className={EYEBROW}>Data</span>
          <Title level={3}>Sprint backlog</Title>
          <Card>
            <Table columns={TASK_COLUMNS} dataSource={TASK_ROWS} rowKey="id" />
          </Card>
        </section>
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
