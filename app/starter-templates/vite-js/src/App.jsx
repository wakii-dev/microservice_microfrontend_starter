import { Alert, Badge, Button, Card, CountUp, Icon, Statistic, Table, Tag, Text, Title } from '@wakii/ui-kit';
import { useAppTheme } from './theme.js';

// Moon/Sun — SVG inline tự vẽ là NGOẠI LỆ có chú thích (rule 9): bộ Icon kit
// (52 primeicons-derived) không có sun/moon. Copy pattern
// app/admin/src/layout/AdminLayout.tsx.
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

// Demo data — đổi thành data thật của bạn khi dựng app.
const TASKS = [
  { id: 1, task: 'Scaffold project', status: 'done', points: 2 },
  { id: 2, task: 'Wire up @wakii/ui-kit tokens', status: 'done', points: 3 },
  { id: 3, task: 'Design first screen', status: 'doing', points: 5 },
  { id: 4, task: 'Connect real data', status: 'todo', points: 8 },
  { id: 5, task: 'Ship v0.1', status: 'todo', points: 13 },
];

const STATUS_BADGE = {
  todo: { variant: 'todo', label: 'To do' },
  doing: { variant: 'doing', label: 'Doing' },
  done: { variant: 'done', label: 'Done' },
};

const STATS = [
  { title: 'Tasks open', value: 12 },
  { title: 'Tasks done', value: 48 },
  { title: 'Points shipped', value: 86 },
];

export function App() {
  const { theme, setTheme } = useAppTheme();

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header tối giản — brand + dark toggle (nâng cấp thành Sidebar/Menu khi app lớn) */}
      <header className="sticky top-0 z-[var(--z-dropdown)] flex h-14 items-center gap-3 border-b border-line bg-s1 px-4 md:px-6">
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-label font-bold text-white"
          >
            {'W'}
          </span>
          {'{{appName}}'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="text"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
        {/* Hero — wash surface + tokens cascade (đổi theme ở header là cả trang đổi) */}
        <section className="flex flex-col items-center gap-4 rounded-xl border border-line bg-s1 p-10 text-center [background-image:var(--wash)]">
          <Tag icon={<Icon name="check-circle" size={12} />}>{'Powered by @wakii/ui-kit'}</Tag>
          <Title level={1} style={{ marginBottom: 0 }}>
            {'{{appName}}'}
          </Title>
          <Text type="secondary" className="m-0 max-w-xl text-body">
            {'Scaffolded by create-wakii-app — tokens-first, dark theme and motion built in. Hit the moon button above.'}
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="primary">{'Primary'}</Button>
            <Button>{'Default'}</Button>
            <Button type="text">{'Text'}</Button>
          </div>
          <code className="rounded-lg border border-line bg-s3 px-3 py-1.5 font-mono text-meta text-ink2">
            {'pnpm add @wakii/ui-kit'}
          </code>
        </section>

        {/* CountUp stats — animate từ 0 khi mount, giảm motion tự tắt theo prefers-reduced-motion */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <Card key={s.title}>
              <Statistic title={s.title} value={<CountUp value={s.value} />} />
            </Card>
          ))}
        </div>

        {/* Table demo — 3 cột, dữ liệu giả; status render bằng Badge token */}
        <Card title="Tasks (demo data)">
          <Table
            columns={[
              { key: 'task', title: 'Task' },
              {
                key: 'status',
                title: 'Status',
                render: (r) => <Badge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</Badge>,
              },
              { key: 'points', title: 'Points', align: 'right' },
            ]}
            dataSource={TASKS}
            rowKey="id"
          />
        </Card>

        {/* Alert — 4 trạng thái */}
        <Card title="Alert — 4 types">
          <div className="flex flex-col gap-2">
            <Alert type="success" message="Saved — changes are live." />
            <Alert type="info" message="Tip — the theme toggle persists to localStorage." />
            <Alert type="warning" message="Demo data — swap TASKS in src/App.jsx with your own." />
            <Alert type="error" message="Nothing is actually on fire here." />
          </div>
        </Card>

        {/* What's inside — links kit */}
        <Card title="What's inside">
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-body">
            <li>
              <a
                href="https://storybook-static-khaki-two.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-accent no-underline hover:underline"
              >
                <Icon name="external-link" size={12} />
                {'Storybook — live catalog of every component'}
              </a>
            </li>
            <li>
              <a
                href="https://www.npmjs.com/package/@wakii/ui-kit"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-accent no-underline hover:underline"
              >
                <Icon name="external-link" size={12} />
                {'npm — @wakii/ui-kit'}
              </a>
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
