// Templates/Dashboard — DASHBOARD-MAX (R11): 10 section, dữ liệu Orca-flavored
// (sprint VU-53, PR, worklog, Kafka/DLQ), ≥25 component kit, live-state thật:
// KPI CountUp refresh · doughnut/line dark-live · Kanban drag + toast · Table
// sort/expand/summary + empty/loading toggle · quick-add → table + toast ·
// notification Drawer + Badge reset · AvatarGroup presence · Calendar upcoming.
// ⚠️ Chart config = shape FLAT của kit (type/labels/datasets top-level) + màu
// resolve từ token qua probe span (canvas không hiểu var(--…)).
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../ui/avatar/index';
import { AvatarGroup } from '../ui/avatar-group/index';
import { Badge } from '../ui/badge/index';
import { Button } from '../ui/button/index';
import { Calendar } from '../ui/calendar/index';
import { Card } from '../ui/card/index';
import { Chart, type ChartConfig } from '../ui/chart/index';
import { CountUp } from '../ui/count-up/index';
import { Drawer } from '../ui/drawer/index';
import { EmptyState } from '../ui/empty-state/index';
import { Field } from '../ui/field/index';
import { Icon } from '../ui/icons/index.js';
import { Input } from '../ui/input/index.js';
import { KanbanBoard, type KanbanColumnData } from '../ui/kanban/index';
import { Layout } from '../ui/layout/index';
import { Menu, type MenuItemData } from '../ui/menu/index';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { message } from '../ui/message/index.js';
import { Select } from '../ui/select/index';
import { Sidebar } from '../ui/sidebar/index';
import { Statistic } from '../ui/statistic/index';
import { Switch } from '../ui/switch/index';
import { Table, type TableColumn } from '../ui/table/index';
import { Tag } from '../ui/tag/index';
import { Timeline, type TimelineItem } from '../ui/timeline/index';

const meta = { title: 'Templates/Dashboard', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** DashboardMax — R11: 10 section shell admin, mọi live-state đều thao tác được. */
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

// ── §1 Shell — Sidebar collapsible + Header (bell → Drawer §9, avatar, sync) ──
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
const FALLBACK_COLORS: Record<'accent' | 'done' | 'doing' | 'fail' | 'ink3', string> = {
  accent: '#1677ff', done: '#52c41a', doing: '#faad14', fail: '#ff4d4f', ink3: '#bfbfbf',
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
      ink3: read('--ink3', FALLBACK_COLORS.ink3),
    });
  }, []);
  return { probeRef, colors };
}

// ── §2 KPI — 4 Statistic CountUp, nút refresh đổi số thật → CountUp animate tiếp ──
type PillTone = 'accent' | 'done' | 'doing' | 'fail';
const PILL_CLS: Record<PillTone, string> = {
  accent: 'bg-accent/10 text-accent',
  done: 'bg-st-done/10 text-st-done',
  doing: 'bg-st-doing/10 text-st-doing',
  fail: 'bg-st-fail/10 text-st-fail',
};

interface Kpi { title: string; value: number; decimals: number; unit: string; delta: string; tone: PillTone; icon: 'users' | 'check-circle' | 'clock' | 'exclamation-triangle'; iconCls: string }
const KPI_BASE: Kpi[] = [
  { title: 'Tasks đóng sprint VU-53', value: 1284, decimals: 0, unit: '', delta: '+12%', tone: 'done', icon: 'check-circle', iconCls: 'bg-st-done/10 text-st-done' },
  { title: 'Tasks mở', value: 316, decimals: 0, unit: '', delta: '+5%', tone: 'doing', icon: 'clock', iconCls: 'bg-st-doing/10 text-st-doing' },
  { title: 'Giờ worklog tuần', value: 128.5, decimals: 1, unit: 'h', delta: 'đúng tiến độ', tone: 'accent', icon: 'users', iconCls: 'bg-accent/10 text-accent' },
  { title: 'Gán thất bại → DLQ', value: 7, decimals: 0, unit: '', delta: '−2', tone: 'fail', icon: 'exclamation-triangle', iconCls: 'bg-st-fail/10 text-st-fail' },
];

// ── §4 Sprint board mini — Kanban 3 cột controlled, drag thật + toast ──
const BOARD_BASE: KanbanColumnData[] = [
  {
    key: 'todo', title: 'To do', wipLimit: 4,
    cards: [
      { key: 't1', title: 'PR #55 — parity wave', description: 'Chờ review T3', tag: 'ui-kit' },
      { key: 't2', title: 'QRCode icon excavate', description: 'R10 — done ở kit', tag: 'antd' },
    ],
  },
  {
    key: 'doing', title: 'Doing', wipLimit: 3,
    cards: [
      { key: 'd1', title: 'Saga assign demo', description: 'fail@demo.local → DLQ', tag: 'kafka' },
      { key: 'd2', title: 'Contracts drift guard', description: 'go snapshot bit-identical', tag: 'ci' },
    ],
  },
  {
    key: 'done', title: 'Done',
    cards: [
      { key: 'x1', title: 'useFieldArray — 12 tests', description: 'Form.List parity', tag: 'forms' },
      { key: 'x2', title: 'Table scroll.y + summary', description: 'antd advanced', tag: 'table' },
    ],
  },
];

// ── §5 Table — sprint tasks (sort + expand + summary + empty/loading toggle) ──
interface Task { id: number; title: string; status: 'todo' | 'doing' | 'done' | 'fail'; assignee: string; hours: number }
const TASKS: Task[] = [
  { id: 101, title: 'Migration design tokens', status: 'done', assignee: 'Alice', hours: 12.5 },
  { id: 102, title: 'Gateway CORS whitelist', status: 'doing', assignee: 'Bob', hours: 6 },
  { id: 103, title: 'Outbox publisher retry', status: 'doing', assignee: 'Carol', hours: 8 },
  { id: 104, title: 'Saga compensation test', status: 'todo', assignee: 'Alice', hours: 0 },
  { id: 105, title: 'DLQ alert threshold', status: 'fail', assignee: 'fail@demo.local', hours: 3.5 },
  { id: 106, title: 'Storybook dark docs', status: 'done', assignee: 'Bob', hours: 5 },
  { id: 107, title: 'Timesheet grid parity', status: 'doing', assignee: 'Carol', hours: 9 },
  { id: 108, title: 'Smoke e2e 2 chiều', status: 'done', assignee: 'Alice', hours: 4 },
];

const STATUS_PILL: Record<Task['status'], { label: string; cls: string }> = {
  todo: { label: 'Cần làm', cls: 'bg-s3 text-ink2' },
  doing: { label: 'Đang làm', cls: 'bg-st-doing/10 text-st-doing' },
  done: { label: 'Xong', cls: 'bg-st-done/10 text-st-done' },
  fail: { label: 'Lỗi', cls: 'bg-st-fail/10 text-st-fail' },
};

// ── §6 Activity feed — Kafka-flavored ──
const ACTIVITY: TimelineItem[] = [
  { key: 'a1', children: 'Alice gán "Gateway CORS" cho Bob', label: '5 phút trước' },
  { key: 'a2', color: 'var(--st-done)', children: 'PR #55 (parity wave) — 1119 tests xanh', label: '1 giờ trước' },
  { key: 'a3', color: 'var(--st-fail)', children: 'Saga gán thất bại → task-events.dlq', label: '2 giờ trước' },
  { key: 'a4', children: 'Bot sync Kafka event task.updated', label: '3 giờ trước' },
];

// ── §9 Notifications — Drawer + Badge reset ──
const NOTIFS = [
  { id: 'n1', title: 'Kafka event', desc: 'task.updated — #102 chuyển Doing', time: '5p' },
  { id: 'n2', title: 'DLQ', desc: 'assignment_failed — fail@demo.local', time: '2h', danger: true },
  { id: 'n3', title: 'Release', desc: '0.3.0 release notes draft sẵn sàng', time: '4h' },
];

// ── §10 Team presence ──
const TEAM = [
  { name: 'Alice Nguyễn', fallback: 'AN' },
  { name: 'Bob Trần', fallback: 'BT' },
  { name: 'Carol Lê', fallback: 'CL' },
  { name: 'David Phạm', fallback: 'DP' },
  { name: 'Hoi Vu', fallback: 'HV' },
  { name: 'Mai Võ', fallback: 'MV' },
];

function AdminDashboard() {
  // R11 responsive: màn hẹp (<768) → ẩn Sider hẳn (nav qua Header); rộng → Sidebar collapsible
  const isWide = useMediaQuery('(min-width: 768px)');
  const [collapsed, setCollapsed] = useState(false);
  const [kpis, setKpis] = useState(KPI_BASE);
  const [board, setBoard] = useState(BOARD_BASE);
  const [tasks, setTasks] = useState(TASKS);
  const [emptyDemo, setEmptyDemo] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickStatus, setQuickStatus] = useState('todo');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(NOTIFS.length);
  const [calendarDay, setCalendarDay] = useState(new Date());
  const { probeRef, colors } = useChartColors();

  // §2 KPI live refresh — CountUp animate tiếp từ số đang hiển thị
  function refreshKpis() {
    setKpis((prev) =>
      prev.map((k) => ({ ...k, value: Math.round(k.value * (0.96 + Math.random() * 0.1) * 10) / 10 })),
    );
    message.success('Đã đồng bộ dữ liệu sprint');
  }

  // §3 Chart kép — line 7 ngày + doughnut phân bố (dark-live qua probe colors)
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
  const doughnutConfig = useMemo<ChartConfig>(
    () => ({
      type: 'doughnut',
      labels: ['Done', 'Doing', 'Todo', 'Fail'],
      datasets: [{ label: 'Phân bố', data: [42, 18, 27, 7], backgroundColor: [colors.done, colors.doing, colors.accent, colors.fail], borderWidth: 0 }],
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' as const, labels: { color: colors.ink3, boxWidth: 10 } } } },
    }),
    [colors],
  );

  // §4 Kanban controlled move — remove từ from → splice toIndex (đã trừ shift)
  function moveCard(cardKey: string, from: string, to: string, toIndex: number) {
    setBoard((prev) => {
      const card = prev.find((c) => c.key === from)?.cards.find((x) => x.key === cardKey);
      if (!card) return prev;
      return prev.map((col) => {
        if (col.key === from) return { ...col, cards: col.cards.filter((x) => x.key !== cardKey) };
        if (col.key === to) {
          const next = [...col.cards];
          next.splice(toIndex, 0, card);
          return { ...col, cards: next };
        }
        return col;
      });
    });
    message.success(`Đã chuyển "${cardKey}" → ${to}`);
  }

  // §8 Quick-add — thêm thẳng vào table (live) + toast
  function quickAdd() {
    const title = quickTitle.trim();
    if (!title) {
      message.error('Tiêu đề trống — nhập ít nhất 1 ký tự.');
      return;
    }
    setTasks((prev) => [{ id: Date.now(), title, status: quickStatus as Task['status'], assignee: 'Alice', hours: 0 }, ...prev]);
    setQuickTitle('');
    message.success(`Đã thêm "${title}" vào sprint.`);
  }

  // §5 Table columns — sort + expand + summary qua Table advanced
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
  ];

  return (
    <Layout hasSider={isWide} className="min-h-screen">
      {/* Probe đọc token màu trong đúng scope theme (dark wrapper cascade tới đây) */}
      <span ref={probeRef} aria-hidden="true" className="hidden" />
      {/* §1 Shell */}
      {isWide && (
        <Layout.Sider collapsed={collapsed}>
          <Sidebar brand={BRAND} footer={USER_CHIP} onToggle={setCollapsed}>
            <Menu items={NAV} selectedKey="home" />
          </Sidebar>
        </Layout.Sider>
      )}
      <Layout>
        <Layout.Header sticky>
          <span className="text-h3 font-semibold text-ink">Sprint VU-53</span>
          <Tag>v0.3.0-rc</Tag>
          <span className="ml-auto flex items-center gap-2">
            <Button size="small" type="text" icon={<Icon name="refresh" size={14} />} onClick={refreshKpis}>
              Đồng bộ
            </Button>
            <Badge count={unread}>
              <button
                type="button"
                aria-label={`Thông báo — ${unread} chưa đọc`}
                onClick={() => setDrawerOpen(true)}
                className="relative grid size-8 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-ink2 transition-colors hover:bg-s3 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
              >
                <Icon name="bell" size={16} />
              </button>
            </Badge>
            <Avatar size={28}>A</Avatar>
          </span>
        </Layout.Header>
        <Layout.Content>
          {/* §2 KPI — CountUp live + refresh */}
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
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

          {/* §3 Charts — line 7 ngày + doughnut phân bố (dark-live) */}
          <div className="grid gap-4 px-4 xl:grid-cols-3">
            <Card title="Tiến độ 7 ngày" className="xl:col-span-2">
              <Chart config={lineConfig} height={240} />
            </Card>
            <Card title="Phân bố trạng thái">
              <Chart config={doughnutConfig} height={240} />
            </Card>
          </div>

          {/* §4 Sprint board mini + §10 team presence */}
          <div className="grid gap-4 p-4 xl:grid-cols-3">
            <Card title="Sprint board — kéo thẻ thử" className="xl:col-span-2">
              <div className="overflow-x-auto">
                <KanbanBoard columns={board} onCardMove={moveCard} ariaLabel="Sprint board VU-53" />
              </div>
            </Card>
            <div className="grid content-start gap-4">
              <Card title="Team đang online">
                <div className="flex flex-col gap-3">
                  <AvatarGroup items={TEAM} max={4} size={32} />
                  <p className="m-0 text-meta text-ink3">
                    6 thành viên · 4 đang worklog (presence pill "+2" hover ra tên).
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEAM.slice(0, 3).map((m) => (
                      <span key={m.name} className="inline-flex items-center gap-1 rounded-pill bg-s3 px-2 py-0.5 text-[10px] text-ink2">
                        <span aria-hidden="true" className="size-1.5 rounded-pill bg-st-done" />
                        {m.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
              {/* §8 Quick-add — Field mini → toast + prepend table */}
              <Card title="Thêm task nhanh">
                <form
                  className="grid gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    quickAdd();
                  }}
                >
                  <Field label="Tiêu đề" htmlFor="quick-title">
                    <Input id="quick-title" name="title" placeholder="VD: Viết recipe useFieldArray…" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} />
                  </Field>
                  <div className="flex items-end gap-2">
                    <Select
                      ariaLabel="Trạng thái"
                      className="w-32"
                      value={quickStatus}
                      onChange={(v) => setQuickStatus(String(v))}
                      options={[
                        { label: 'Cần làm', value: 'todo' },
                        { label: 'Đang làm', value: 'doing' },
                        { label: 'Xong', value: 'done' },
                      ]}
                    />
                    <Button htmlType="submit" type="primary" icon={<Icon name="plus" size={14} />}>Thêm</Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>

          {/* §5 Table + toggles — §6 Timeline — §7 Upcoming calendar */}
          <div className="grid gap-4 p-4 xl:grid-cols-3">
            <Card
              title="Tasks mới nhất"
              className="xl:col-span-2"
              extra={
                <span className="flex items-center gap-3 text-meta text-ink3">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    Empty demo
                    <Switch checked={emptyDemo} onChange={setEmptyDemo} size="small" aria-label="Bật demo empty state" />
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    Loading demo
                    <Switch checked={loadingDemo} onChange={setLoadingDemo} size="small" aria-label="Bật demo loading skeleton" />
                  </label>
                </span>
              }
            >
              <Table
                columns={columns}
                dataSource={emptyDemo ? [] : tasks}
                rowKey="id"
                size="small"
                loading={loadingDemo}
                emptyMessage={
                  <EmptyState
                    title="Sprint đã sạch bóng"
                    description="Không còn task nào khớp — thêm task nhanh ở card bên trên."
                    action={<Button size="small" onClick={() => setEmptyDemo(false)}>Hiện lại</Button>}
                  />
                }
                expandable={{
                  expandedRowRender: (t) => (
                    <div className="text-label text-ink2">
                      Đã log {t.hours}h · Cập nhật 2 giờ trước · Ưu tiên {t.status === 'fail' ? 'cao' : 'trung bình'}
                    </div>
                  ),
                }}
                summary={(page) => (
                  <div className="flex items-center justify-between text-label text-ink2">
                    <span>{page.length} task trên trang</span>
                    <span className="text-ink">Σ {page.reduce((s, t) => s + t.hours, 0)}h worklog</span>
                  </div>
                )}
              />
            </Card>
            <div className="grid content-start gap-4">
              <Card title="Hoạt động">
                <Timeline items={ACTIVITY} />
              </Card>
              {/* §7 Upcoming — Calendar mini (chọn ngày deadline) */}
              <Card title="Deadline gần — chọn ngày">
                <Calendar bare value={calendarDay} onChange={setCalendarDay} />
                <p className="m-0 mt-2 text-meta text-ink3">
                  Đang xem: <span className="text-ink2">{calendarDay.toLocaleDateString('vi-VN')}</span> — 2 deadline (PR #55 review, 0.3.0 cut).
                </p>
              </Card>
            </div>
          </div>
        </Layout.Content>
        <Layout.Footer>© 2026 Wakii Admin — Template demo (R11: 10 section · ≥25 components)</Layout.Footer>
      </Layout>

      {/* §9 Notifications Drawer — bell mở, "đánh dấu đã đọc" reset Badge */}
      <Drawer open={drawerOpen} title="Thông báo" width={360} onClose={() => setDrawerOpen(false)}>
        <div className="grid gap-3">
          {NOTIFS.map((n) => (
            <div key={n.id} className={`rounded-xl border p-3 ${n.danger ? 'border-st-fail/40 bg-st-fail/5' : 'border-line bg-s2'}`}>
              <p className="m-0 flex items-center gap-2 text-label font-medium text-ink">
                {n.danger && <Icon name="exclamation-triangle" size={12} className="text-st-fail" />}
                {n.title}
                <span className="ml-auto font-normal text-meta text-ink3">{n.time}</span>
              </p>
              <p className="m-0 mt-1 text-label text-ink2">{n.desc}</p>
            </div>
          ))}
          <Button
            type="default"
            onClick={() => {
              setUnread(0);
              message.success('Đã đánh dấu tất cả là đã đọc.');
            }}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </Drawer>
    </Layout>
  );
}
