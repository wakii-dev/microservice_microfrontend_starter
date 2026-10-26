// Trang chủ demo — dogfood @wakii/ui-kit đồng bộ brand (header W + dark toggle +
// Alert/Table/Statistic), copy pattern router feat của starter Vite.
// ⚠️ Trang dùng component kit cần 'use client' (app router): kit ship thuần cho
// Vite/MF, không mang directive sẵn — không cần transpilePackages, CSS là đủ.
'use client';

import { useState } from 'react';
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
import { ThemeToggle } from './components/ThemeToggle';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

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

export default function Home() {
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-12">
        {/* Hero — giới thiệu + 2 Button */}
        <section className="flex flex-col gap-3">
          <span className={EYEBROW}>@wakii/ui-kit × Next.js</span>
          <Title level={1}>
            Welcome to {'{{appName}}'} — <span className="text-accent">ship beautiful UI</span>, fast.
          </Title>
          <div className="max-w-2xl">
            <Text type="secondary">
              This starter is wired with the full kit: design tokens, dark mode and 90+ components, styled with
              Tailwind v4 utilities. Edit <Text code>app/page.tsx</Text> and make it yours.
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
              message="Keep the @source lines in app/globals.css — kit utilities are scanned from node_modules."
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
