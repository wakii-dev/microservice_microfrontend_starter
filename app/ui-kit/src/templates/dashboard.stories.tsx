// Templates/Dashboard — app shell admin THẬT ghép từ kit: Layout (Header brand +
// bell notification + Sider compose Sidebar collapsible) · KPI row 4 Statistic
// (CountUp live + pill delta) · Chart line/bar (peer-dep chart.js lazy) ·
// Table CRUD mini (selection + expandable + Actions + Pagination client) ·
// Timeline hoạt động. Density pro: gap-4/p-4, text-meta/label.
// ⚠️ Chart config = shape FLAT của kit (type/labels/datasets top-level — KHÔNG
// bọc data:{}) + màu resolve từ token qua probe span (canvas không hiểu
// var(--…); Chart re-init khi config JSON đổi → palette đúng cả dark story).
// Tokens-only mọi className; dark ăn nhờ cascade data-bp-theme="dark".
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../ui/avatar/index';
import { Badge } from '../ui/badge/index';
import { Button } from '../ui/button/index';
import { Card } from '../ui/card/index';
import { Chart, type ChartConfig } from '../ui/chart/index';
import { CountUp } from '../ui/count-up/index';
import { Icon } from '../ui/icons/index.js';
import { Layout } from '../ui/layout/index';
import { Menu, type MenuItemData } from '../ui/menu/index';
import { message } from '../ui/message/index.js';
import { notification } from '../ui/notification/index.js';
import { Pagination } from '../ui/pagination/index';
import { Sidebar } from '../ui/sidebar/index';
import { Statistic } from '../ui/statistic/index';
import { Table, type TableColumn } from '../ui/table/index';
import { Tag } from '../ui/tag/index';
import { Timeline, type TimelineItem } from '../ui/timeline/index';

const meta = { title: 'Templates/Dashboard', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** Dashboard — full admin shell: shell + KPI CountUp + charts + Table CRUD mini + Timeline. */
export const Dashboard: S = {
  render: () => <AdminDashboard />,
};

/** DarkTheme — same shell under `data-bp-theme="dark"`: tokens cascade, chart palette re-resolves. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="min-h-screen bg-canvas">
      <AdminDashboard />
    </div>
  ),
};

// ── Navigation (Sidebar collapsible — trigger pill bên trong Sidebar) ──
const NAV: MenuItemData[] = [
  { key: 'home', label: 'Tổng quan', icon: <Icon name="home" size={14} /> },
  {
    key: 'manage',
    label: 'Quản lý',
    icon: <Icon name="folder" size={14} />,
    children: [
      { key: 'tasks', label: 'Tasks', icon: <Icon name="file" size={14} /> },
      { key: 'users', label: 'Người dùng', icon: <Icon name="users" size={14} /> },
    ],
  },
  { key: 'reports', label: 'Báo cáo', icon: <Icon name="file" size={14} /> },
];

const BRAND = (
  <span className="flex items-center gap-2">
    <span aria-hidden="true" className="size-7 shrink-0 rounded-lg bg-accent" />
    <span className="truncate text-body font-semibold text-ink">Wakii Admin</span>
  </span>
);

const USER_CHIP = (
  <span className="flex items-center gap-2">
    <Avatar size={24}>A</Avatar>
    <span className="truncate text-meta text-ink2">alice@demo.local</span>
  </span>
);

// ── Chart màu — resolve token từ scope theme (canvas không hiểu var(--…)) ──
const FALLBACK_COLORS: { accent: string; done: string; doing: string; fail: string } = {
  accent: '#1677ff',
  done: '#52c41a',
  doing: '#faad14',
  fail: '#ff4d4f',
};

function useChartColors() {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [colors, setColors] = useState(FALLBACK_COLORS);
  useLayoutEffect(() => {
    const cs = probeRef.current ? getComputedStyle(probeRef.current) : null;
    if (!cs) return;
    const read = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
    setColors({
      accent: read('--accent', FALLBACK_COLORS.accent),
      done: read('--st-done', FALLBACK_COLORS.done),
      doing: read('--st-doing', FALLBACK_COLORS.doing),
      fail: read('--st-fail', FALLBACK_COLORS.fail),
    });
  }, []);
  return { probeRef, colors };
}

// ── KPI row — Statistic + CountUp + pill delta ──
type PillTone = 'accent' | 'done' | 'doing' | 'fail';
const PILL_CLS: Record<PillTone, string> = {
  accent: 'bg-accent/10 text-accent',
  done: 'bg-st-done/10 text-st-done',
  doing: 'bg-st-doing/10 text-st-doing',
  fail: 'bg-st-fail/10 text-st-fail',
};

const KPIS: { title: string; value: number; decimals: number; unit: string; delta: string; tone: PillTone; icon: 'users' | 'check-circle' | 'clock' | 'exclamation-triangle'; iconCls: string }[] = [
  { title: 'Người dùng hoạt động', value: 1284, decimals: 0, unit: '', delta: '+12%', tone: 'done', icon: 'users', iconCls: 'bg-accent/10 text-accent' },
  { title: 'Tasks mở', value: 316, decimals: 0, unit: '', delta: '+5%', tone: 'doing', icon: 'check-circle', iconCls: 'bg-st-doing/10 text-st-doing' },
  { title: 'Giờ log tuần này', value: 128.5, decimals: 1, unit: 'h', delta: 'đúng tiến độ', tone: 'accent', icon: 'clock', iconCls: 'bg-accent/10 text-accent' },
  { title: 'Gán thất bại', value: 7, decimals: 0, unit: '', delta: '−2', tone: 'fail', icon: 'exclamation-triangle', iconCls: 'bg-st-fail/10 text-st-fail' },
];

// ── Table CRUD mini ──
type Task = { id: number; title: string; status: 'todo' | 'doing' | 'done' | 'fail'; assignee: string; hours: number };

const TASKS: Task[] = [
  { id: 1, title: 'Task #101 — Migration design tokens', status: 'done', assignee: 'Alice', hours: 12.5 },
  { id: 2, title: 'Task #102 — Gateway CORS whitelist', status: 'doing', assignee: 'Bob', hours: 6 },
  { id: 3, title: 'Task #103 — Outbox publisher retry', status: 'doing', assignee: 'Carol', hours: 8 },
  { id: 4, title: 'Task #104 — Saga compensation test', status: 'todo', assignee: 'Alice', hours: 0 },
  { id: 5, title: 'Task #105 — DLQ alert threshold', status: 'fail', assignee: 'fail@demo.local', hours: 3.5 },
  { id: 6, title: 'Task #106 — Storybook dark docs', status: 'done', assignee: 'Bob', hours: 5 },
  { id: 7, title: 'Task #107 — Timesheet grid parity', status: 'doing', assignee: 'Carol', hours: 9 },
  { id: 8, title: 'Task #108 — Smoke e2e 2 chiều', status: 'done', assignee: 'Alice', hours: 4 },
  { id: 9, title: 'Task #109 — Scaffold add-service', status: 'todo', assignee: 'Bob', hours: 0 },
  { id: 10, title: 'Task #110 — Contracts drift guard', status: 'fail', assignee: 'Carol', hours: 2 },
];

const STATUS_PILL: Record<Task['status'], { label: string; cls: string }> = {
  todo: { label: 'Cần làm', cls: 'bg-s3 text-ink2' },
  doing: { label: 'Đang làm', cls: 'bg-st-doing/10 text-st-doing' },
  done: { label: 'Xong', cls: 'bg-st-done/10 text-st-done' },
  fail: { label: 'Lỗi', cls: 'bg-st-fail/10 text-st-fail' },
};

const PAGE_SIZE = 4;

const ACTIVITY: TimelineItem[] = [
  { key: 'a1', children: 'Alice gán Task #102 cho Bob', label: '5 phút trước' },
  { key: 'a2', color: 'var(--st-done)', children: 'Task #99 chuyển Xong', label: '1 giờ trước' },
  { key: 'a3', color: 'var(--st-fail)', children: 'Saga gán thất bại → DLQ', label: '2 giờ trước' },
  { key: 'a4', children: 'Bot sync Kafka event task.updated', label: '3 giờ trước' },
];

function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Task[]>([]);
  const { probeRef, colors } = useChartColors();

  // Config JSON-stable + màu resolve xong → Chart tự re-init với palette đúng
  const lineConfig = useMemo<ChartConfig>(
    () => ({
      type: 'line',
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [
        { label: 'Đóng', data: [12, 19, 8, 22, 30, 25, 18], borderColor: colors.accent, backgroundColor: colors.accent, borderWidth: 2 },
        { label: 'Tạo', data: [8, 12, 14, 10, 18, 9, 5], borderColor: colors.done, backgroundColor: colors.done, borderWidth: 2 },
      ],
      options: { responsive: true, maintainAspectRatio: false, elements: { line: { tension: 0.35 } } },
    }),
    [colors],
  );

  const barConfig = useMemo<ChartConfig>(
    () => ({
      type: 'bar',
      labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      datasets: [
        { label: 'Tạo', data: [8, 12, 14, 10, 18, 9, 5], backgroundColor: colors.accent },
        { label: 'Đóng', data: [6, 10, 8, 14, 16, 7, 3], backgroundColor: colors.done },
      ],
      options: { responsive: true, maintainAspectRatio: false },
    }),
    [colors],
  );

  const paged = useMemo(() => TASKS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page]);

  const columns: TableColumn<Task>[] = [
    { key: 'title', title: 'Task', sortable: true },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (t) => (
        <span className={`inline-flex rounded-pill px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[t.status].cls}`}>
          {STATUS_PILL[t.status].label}
        </span>
      ),
    },
    {
      key: 'assignee',
      title: 'Assignee',
      render: (t) => (
        <span className="flex items-center gap-1.5">
          <Avatar size={20}>{t.assignee.charAt(0)}</Avatar>
          <span className="text-label text-ink2">{t.assignee}</span>
        </span>
      ),
    },
    { key: 'hours', title: 'Giờ', align: 'right', render: (t) => <span className="tabular-nums">{t.hours}h</span> },
    {
      key: 'act',
      title: '',
      render: (t) => (
        <span className="flex justify-end gap-1">
          <Button size="small" onClick={() => message.success(`Mở ${t.title}`)}>
            Sửa
          </Button>
          <Button size="small" type="text" onClick={() => notification.warning('Xoá task', `${t.title} — cần Popconfirm trước khi xoá (demo).`)}>
            Xoá
          </Button>
        </span>
      ),
    },
  ];

  return (
    <Layout hasSider className="min-h-screen">
      {/* Probe đọc token màu trong đúng scope theme (dark wrapper cascade tới đây) */}
      <span ref={probeRef} aria-hidden="true" className="hidden" />
      <Layout.Sider collapsed={collapsed}>
        <Sidebar brand={BRAND} footer={USER_CHIP} onToggle={setCollapsed}>
          <Menu items={NAV} selectedKey="home" />
        </Sidebar>
      </Layout.Sider>
      <Layout>
        <Layout.Header sticky>
          <span className="text-h3 font-semibold text-ink">Tổng quan</span>
          <Tag>v2.3.0</Tag>
          <span className="ml-auto flex items-center gap-2">
            <Button
              size="small"
              type="text"
              icon={<Icon name="refresh" size={14} />}
              onClick={() => message.success('Đã đồng bộ dữ liệu')}
            >
              Đồng bộ
            </Button>
            <Badge count={3}>
              <button
                type="button"
                aria-label="Thông báo — 3 chưa đọc"
                onClick={() => notification.info('Kafka event', 'task.updated — activity feed đã cập nhật.')}
                className="relative grid size-8 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-ink2 transition-colors hover:bg-s3 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              >
                <Icon name="bell" size={16} />
              </button>
            </Badge>
            <Avatar size={28}>A</Avatar>
          </span>
        </Layout.Header>
        <Layout.Content>
          {/* KPI row */}
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((k) => (
              <Card key={k.title}>
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-lg ${k.iconCls}`}>
                    <Icon name={k.icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Statistic
                      title={k.title}
                      value={<CountUp value={k.value} decimals={k.decimals} duration={1.2} format={(n) => n.toLocaleString('vi-VN')} />}
                      suffix={k.unit}
                    />
                  </div>
                  <span className={`shrink-0 rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${PILL_CLS[k.tone]}`}>{k.delta}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 px-4 xl:grid-cols-3">
            <Card title="Tiến độ theo ngày" className="xl:col-span-2">
              <Chart config={lineConfig} height={240} />
            </Card>
            <Card title="Tạo vs đóng">
              <Chart config={barConfig} height={240} />
            </Card>
          </div>

          {/* Table CRUD mini + Timeline */}
          <div className="grid gap-4 p-4 xl:grid-cols-3">
            <Card
              title="Tasks gần đây"
              className="xl:col-span-2"
              extra={<span className="text-meta text-ink3">{selected.length} đã chọn</span>}
            >
              <Table
                columns={columns}
                dataSource={paged}
                rowKey="id"
                size="small"
                selectionMode="checkbox"
                onSelectionChange={setSelected}
                expandable={{
                  expandedRowRender: (t) => (
                    <div className="text-label text-ink2">
                      Đã log {t.hours}h · Cập nhật 2 giờ trước · Ưu tiên {t.status === 'fail' ? 'cao' : 'trung bình'}
                    </div>
                  ),
                }}
              />
              <div className="mt-3 flex items-center justify-end">
                <Pagination current={page} pageSize={PAGE_SIZE} total={TASKS.length} onChange={setPage} />
              </div>
            </Card>
            <Card title="Hoạt động">
              <Timeline items={ACTIVITY} />
            </Card>
          </div>
        </Layout.Content>
        <Layout.Footer>© 2026 Wakii Admin — Template demo</Layout.Footer>
      </Layout>
    </Layout>
  );
}
