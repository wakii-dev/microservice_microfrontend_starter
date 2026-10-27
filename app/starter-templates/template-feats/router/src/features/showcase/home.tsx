// Showcase Home — trang demo dogfooding kit (hero + KPI + sections Reveal).
// Thuộc feature `showcase`: xoá demo = xoá thư mục này + route/nav trong App.
import { useState } from 'react';
import { useNavigate } from 'react-router';
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

export function ShowcaseHome() {
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
            with Tailwind v4 utilities. Edit <Text code>src/features/showcase/home.tsx</Text> and make it yours.
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
            Ready to build? Start editing <Text code>src/features/showcase/home.tsx</Text> — the kit has 90+
            components waiting.
          </Text>
          <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
            Browse Storybook
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
