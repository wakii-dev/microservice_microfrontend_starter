// Templates/Docs Portal — tài liệu Orca (R11 Template-Max): Tree điều hướng nhiều cấp
// + Anchor scroll-spy phải + Input.Search lọc section THẬT (EmptyState khi không khớp)
// + Descriptions API + code block Typography copy-được (useCopyToClipboard + message)
// + Divider/Tag version/Timeline/Steps/Collapse/Alert/Badge/Tooltip/Statistic/Segmented.
// REF-SPEC editorial: label uppercase tracking rộng, LIGHT weight, copy ngắn 2 dòng.
import { useMemo, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  EmptyState,
  Icon,
  message,
  Progress,
  Segmented,
  Statistic,
  Steps,
  Tag,
  Timeline,
  Tooltip,
  Tree,
  Typography,
  useCopyToClipboard,
} from '../index';
import { SearchInput } from '../ui/input/input-search.js';

const meta = { title: 'Templates/Docs Portal', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/* ── Dữ liệu docs (Orca-flavored) ─────────────────────────────────────────── */

const VERSION = 'v0.2.2';

interface DocSection {
  id: string;
  title: string;
  tags: string[];
  body: ReactNode;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, copy] = useCopyToClipboard();
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-s3">
      <button
        type="button"
        aria-label="Copy code"
        onClick={() => {
          void copy(code);
          message.success(copied ? 'Đã copy lại' : 'Đã copy vào clipboard');
        }}
        className="absolute right-2 top-2 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-ink3 hover:bg-s2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Icon name="copy" size={14} />
      </button>
      <Typography.Paragraph className="!m-0 overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-ink" style={{ whiteSpace: 'pre' }}>
        {code}
      </Typography.Paragraph>
    </div>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[2.4px] text-ink3">{kicker}</p>
      <Typography.Title level={2} className="!mt-1 !mb-3" style={{ fontWeight: 300, letterSpacing: '0.02em' }}>
        {title}
      </Typography.Title>
      <div className="flex flex-col gap-3 text-body text-ink2">{children}</div>
      <Divider className="!my-6" />
    </section>
  );
}

const TREE_DATA = [
  {
    key: 'start',
    label: 'Bắt đầu',
    children: [
      { key: 'sec-install', label: 'Cài đặt' },
      { key: 'sec-tokens', label: 'Tokens & theming' },
    ],
  },
  {
    key: 'build',
    label: 'Xây với ui-kit',
    children: [
      { key: 'sec-api', label: 'Components API' },
      { key: 'sec-form', label: 'useForm + zod' },
      { key: 'sec-events', label: 'Events & outbox' },
    ],
  },
  {
    key: 'ops',
    label: 'Vận hành',
    children: [
      { key: 'sec-cli', label: 'CLI & scaffold' },
      { key: 'sec-release', label: 'Release & version' },
    ],
  },
];

const ALL_SECTIONS: DocSection[] = [
  {
    id: 'sec-install',
    title: 'Cài đặt',
    tags: ['install', 'pnpm', 'setup', 'cài đặt'],
    body: (
      <>
        <p className="m-0">Ui-kit consumed qua source — sửa là thấy ngay, không build riêng. Peer-dep tự cài theo nhu cầu.</p>
        <CodeBlock code={'pnpm add @wakii/ui-kit\n# peer: zod (useForm) · chart.js · @fullcalendar/* · @tiptap/*'} />
        <Alert
          type="info"
          message="Subpath imports"
          description="Import nặng qua subpath: @wakii/ui-kit/carousel | chart | schedule | editor — giữ bundle của remote gọn."
        />
      </>
    ),
  },
  {
    id: 'sec-tokens',
    title: 'Tokens & theming',
    tags: ['tokens', 'dark', 'theme', 'giao diện'],
    body: (
      <>
        <p className="m-0">13 token groups cascade qua CSS vars — dark mode là 1 attribute, không code riêng.</p>
        <TokenLiveDemo />
      </>
    ),
  },
  {
    id: 'sec-api',
    title: 'Components API',
    tags: ['api', 'props', 'component', 'tham chiếu'],
    body: (
      <>
        <p className="m-0">Hợp đồng component được đo lường như API — ví dụ `<Tag>TaskStatusBadge</Tag>`:</p>
        <Descriptions
          bordered
          items={[
            { label: 'status', children: <span className="font-mono text-label">'todo' | 'doing' | 'done' | 'fail'</span> },
            { label: 'showDot', children: <span className="font-mono text-label">boolean = true</span> },
            { label: 'size', children: <span className="font-mono text-label">'sm' | 'md'</span> },
            { label: 'onLoad', children: <span className="font-mono text-label">(task) → void</span> },
          ]}
        />
        <p className="m-0">
          Toàn bộ 90 component có bản ghi tương tự trong Storybook — docs là artifact, không phải sau-suy.
        </p>
      </>
    ),
  },
  {
    id: 'sec-form',
    title: 'useForm + zod',
    tags: ['form', 'zod', 'validation', 'biểu mẫu'],
    body: (
      <>
        <p className="m-0">Zod schema là nguồn chân truth validate; lỗi đổ về `errors.field` + auto-focus input đầu tiên.</p>
        <CodeBlock code={"const form = useForm({\n  schema: z.object({ title: z.string().min(1), point: z.number().max(21) }),\n  mode: 'onSubmit',\n});"} />
        <Steps
          current={1}
          items={[{ title: 'Schema' }, { title: 'useForm' }, { title: 'Field + Input' }, { title: 'Submit' }]}
        />
      </>
    ),
  },
  {
    id: 'sec-events',
    title: 'Events & outbox',
    tags: ['kafka', 'outbox', 'saga', 'event'],
    body: (
      <>
        <p className="m-0">Task event chảy 2 chiều qua Kafka — assignment fail đỗ DLQ, UI báo đúng trạng thái.</p>
        <Timeline
          items={[
            { key: 't0', label: 't0 · node-svc', children: 'Task.created → outbox row', color: 'var(--accent)' },
            { key: 't1', label: 't1 · go-svc', children: 'consumer cập nhật activity feed', color: 'var(--accent)' },
            { key: 't2', label: 't2 · saga', children: 'assignment_failed → task-events.dlq', color: 'var(--st-fail)' },
            { key: 't3', label: 't3 · UI', children: 'Badge "Gán thất bại" + retry có chủ đích' },
          ]}
        />
      </>
    ),
  },
  {
    id: 'sec-cli',
    title: 'CLI & scaffold',
    tags: ['cli', 'scaffold', 'service', 'tạo service'],
    body: (
      <>
        <p className="m-0">Scaffold service mới 4 bước, kèm AI files — không bootstrap tay.</p>
        <CodeBlock code={'bash scripts/scaffold/scaffold.sh <tên-mới>\n# → services/<tên-mới> + conventions + orca.yaml patch'} />
      </>
    ),
  },
  {
    id: 'sec-release',
    title: 'Release & version',
    tags: ['release', 'version', 'changeset', 'publish'],
    body: (
      <>
        <p className="m-0">Changeset-drive; publish GitHub Packages rồi mirror npmjs.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Statistic title='Phiên bản' value={VERSION} />
          <Statistic title='Components' value={90} suffix="+" />
          <Statistic title='Tests' value={1074} suffix="" />
        </div>
        <Collapse
          items={[
            {
              key: 'log',
              label: 'Changelog — 3 mục gần nhất',
              children: (
                <Timeline
                  items={[
                    { key: 'r3', children: '0.2.2 — InputSearch + Link + Affix (P0 parity)', color: 'var(--st-done)' },
                    { key: 'r2', children: '0.2.1 — dual-registry release, token env-wired', color: 'var(--st-done)' },
                    { key: 'r1', children: '0.2.0 — Experience 3D + motion family', color: 'var(--accent)' },
                  ]}
                />
              ),
            },
          ]}
        />
      </>
    ),
  },
];

/* ── Live demo nhỏ (R11-2: mỗi section ≥1 live-state) ────────────────────── */

function TokenLiveDemo() {
  const [density, setDensity] = useState('comfort');
  const pad = density === 'comfort' ? 'p-4' : density === 'compact' ? 'p-2' : 'p-3';
  return (
    <Card className="max-w-xl">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={density}
          onChange={setDensity}
          options={[
            { label: 'Compact', value: 'compact' },
            { label: 'Cozy', value: 'cozy' },
            { label: 'Comfort', value: 'comfort' },
          ]}
        />
        <Tooltip title="Đổi data-bp-theme — token cascade live">
          <Button size="small" onClick={() => {
            const html = document.documentElement;
            const next = html.getAttribute('data-bp-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-bp-theme', next);
            message.info(`Theme → ${next}`);
          }}>
            Toggle dark
          </Button>
        </Tooltip>
        <Progress percent={density === 'comfort' ? 100 : density === 'cozy' ? 66 : 33} showInfo={false} className="min-w-24 flex-1" />
      </div>
      <div className={`mt-3 grid gap-2 rounded-lg border border-line bg-s2 ${pad} transition-all`}>
        <span className="text-label font-semibold text-ink"> sprint-vu53 · tokens preview</span>
        <span className="text-body text-ink2">Padding section đổi theo density — 1 class, 0 re-render token.</span>
      </div>
    </Card>
  );
}

/* ── Trang portal ─────────────────────────────────────────────────────────── */

function Portal() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const sections = useMemo(
    () => (q ? ALL_SECTIONS.filter((s) => s.title.toLowerCase().includes(q) || s.tags.some((t) => t.includes(q))) : ALL_SECTIONS),
    [q],
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header portal */}
      <header className="sticky top-0 z-[var(--z-popover)] border-b border-line bg-s1/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="mx-auto flex max-w-[80rem] flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-[2.4px] text-ink">
            <Icon name="file" size={16} /> orca docs
          </span>
          <Tag>{VERSION}</Tag>
          <div className="ml-auto w-full max-w-sm">
            <SearchInput
              size="small"
              placeholder="Lọc section — thử 'kafka' hoặc 'zzz'…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Tooltip title="2 thông báo chưa đọc">
            <Badge count={2}>
              <Avatar size={28}>A</Avatar>
            </Badge>
          </Tooltip>
        </div>
      </header>

      <div className="mx-auto flex max-w-[80rem] gap-6 px-4 py-6 md:px-6">
        {/* Sidebar Tree */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">Hướng dẫn</p>
            <Tree
              data={TREE_DATA}
              defaultExpandedKeys={['start', 'build']}
              showLine
              className="text-body"
            />
            <Divider className="!my-4" />
            <div className="flex flex-col gap-2 text-label text-ink3">
              <span className="flex items-center gap-1.5"><Icon name="external-link" size={12} /> GitHub</span>
              <span className="flex items-center gap-1.5"><Icon name="download" size={12} /> Storybook static</span>
            </div>
          </div>
        </aside>

        {/* Nội dung */}
        <main className="min-w-0 max-w-3xl flex-1">
          <Breadcrumb
            className="mb-4"
            items={[{ title: 'Docs' }, { title: 'Ui-kit' }, { title: q ? `Lọc: "${query}"` : 'Tổng quan' }]}
          />
          {sections.length === 0 ? (
            <EmptyState
              title="Không có section khớp"
              description={`Không tìm thấy mục nào cho "${query}". Thử 'token', 'form', 'kafka'… hoặc xoá bộ lọc.`}
              action={<Button type="primary" onClick={() => setQuery('')}>Xoá tìm kiếm</Button>}
            />
          ) : (
            <>
              <p className="!m-0 mb-6 text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">
                {sections.length}/{ALL_SECTIONS.length} section
              </p>
              {sections.map((s) => (
                <Section key={s.id} id={s.id} title={s.title} kicker="orca × wakii">
                  {s.body}
                </Section>
              ))}
            </>
          )}
        </main>

        {/* Anchor scroll-spy phải */}
        <aside className="hidden w-48 shrink-0 xl:block">
          <div className="sticky top-20">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[2.64px] text-ink3">Trang này</p>
            <Anchor
              offsetTop={96}
              items={sections.map((s) => ({ href: `#${s.id}`, title: s.title }))}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Docs Portal — Tree + Anchor + search-lọc-thật + API docs (R11 Template-Max). */
export const DocsPortal: Story = {
  name: 'Docs Portal — sidebar Tree + Anchor + search lọc thật',
  render: () => <Portal />,
};
