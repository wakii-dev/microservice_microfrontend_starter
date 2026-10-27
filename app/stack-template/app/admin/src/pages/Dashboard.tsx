// Dashboard — ghép theo Templates/Dashboard (templates-dashboard--dashboard) của kit:
// Row/Col + Card/Statistic KPI (CountUp live + refresh) · chart line + doughnut màu
// resolve qua useChartPalette (hook public theming 2 — thay probe tự vẽ cũ) · Table
// tasks gần đây (sort + expand + summary + empty/loading demo) · Timeline hoạt động ·
// quick-add → table + toast · team presence AvatarGroup. Data qua fetchDashboard()
// mock (shape thật + latency) — skeleton Card loading + Table loading thật.
// Customize pass: Card/Statistic + Layout zones dùng classNames slots (dogfood
// slots-wave; Button slots skip — kit leak prop qua rest, xem comment nút Làm mới).
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  Col,
  CountUp,
  EmptyState,
  Field,
  Icon,
  Input,
  Row,
  Select,
  Statistic,
  Switch,
  Table,
  Tag,
  Timeline,
  message,
  useChartPalette,
  type ChartConfig,
  type TableColumn,
} from '@wakii/ui-kit';
import { Chart } from '@wakii/ui-kit/chart';
import { fetchDashboard, type DashboardData, type RecentTask } from '../data/dashboard.js';

// Pill tone theo trạng thái KPI — bg token/10 + chữ token (same PILL_CLS template).
const PILL_CLS = {
  accent: 'bg-accent/10 text-accent',
  done: 'bg-st-done/10 text-st-done',
  doing: 'bg-st-doing/10 text-st-doing',
  fail: 'bg-st-fail/10 text-st-fail',
} as const;

const STATUS_PILL: Record<RecentTask['status'], { label: string; cls: string }> = {
  todo: { label: 'Cần làm', cls: 'bg-s3 text-ink2' },
  doing: { label: 'Đang làm', cls: 'bg-st-doing/10 text-st-doing' },
  done: { label: 'Xong', cls: 'bg-st-done/10 text-st-done' },
  fail: { label: 'Lỗi', cls: 'bg-st-fail/10 text-st-fail' },
};

const QUICK_STATUS_OPTIONS = [
  { label: 'Cần làm', value: 'todo' },
  { label: 'Đang làm', value: 'doing' },
  { label: 'Xong', value: 'done' },
];

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<RecentTask[]>([]);
  const [emptyDemo, setEmptyDemo] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickStatus, setQuickStatus] = useState('todo');
  const { ref: paletteRef, palette } = useChartPalette();

  // Load mock fetch — lần đầu skeleton, refresh → CountUp animate lại từ số cũ.
  const load = useCallback(async (announce: boolean) => {
    const next = await fetchDashboard();
    setData(next);
    setTasks(next.tasks);
    if (announce) message.success('Đã đồng bộ dữ liệu sprint');
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  // Chart config — màu dataset từ palette token (canvas không hiểu var(--…)); đổi
  // theme → palette re-resolve → config đổi → Chart re-init (live dark toggle).
  const lineConfig = useMemo<ChartConfig | null>(() => {
    if (!data) return null;
    return {
      type: 'line',
      labels: data.weekly.labels,
      datasets: [
        { label: 'Đóng', data: data.weekly.closed, borderColor: palette.accent, backgroundColor: palette.accent, borderWidth: 2 },
        { label: 'Tạo', data: data.weekly.created, borderColor: palette.stDone, backgroundColor: palette.stDone, borderWidth: 2 },
      ],
      options: { responsive: true, maintainAspectRatio: false, elements: { line: { tension: 0.35 } } },
    };
  }, [data, palette]);

  const doughnutConfig = useMemo<ChartConfig | null>(() => {
    if (!data) return null;
    return {
      type: 'doughnut',
      labels: ['Done', 'Doing', 'Todo', 'Fail'],
      datasets: [
        {
          label: 'Phân bố',
          data: [data.distribution.done, data.distribution.doing, data.distribution.todo, data.distribution.fail],
          backgroundColor: [palette.stDone, palette.stDoing, palette.accent, palette.stFail],
          borderWidth: 0,
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom' as const, labels: { color: palette.ink3, boxWidth: 10 } } },
      },
    };
  }, [data, palette]);

  function quickAdd() {
    const title = quickTitle.trim();
    if (!title) {
      message.error('Tiêu đề trống — nhập ít nhất 1 ký tự.');
      return;
    }
    setTasks((prev) => [
      { id: Date.now(), title, status: quickStatus as RecentTask['status'], assignee: 'Alice', hours: 0, updated: 'vừa xong' },
      ...prev,
    ]);
    setQuickTitle('');
    message.success(`Đã thêm "${title}" vào sprint.`);
  }

  const columns: TableColumn<RecentTask>[] = [
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
          <Avatar size={20}>{t.assignee.charAt(0).toUpperCase()}</Avatar>
          <span className="text-label text-ink2">{t.assignee}</span>
        </span>
      ),
    },
    { key: 'hours', title: 'Giờ', align: 'right', sortable: true, render: (t) => <span className="tabular-nums">{t.hours}h</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Probe đọc token trong đúng theme scope — palette live theo dark toggle */}
      <span ref={paletteRef} aria-hidden="true" className="hidden" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-h1 font-semibold text-ink">Dashboard</h1>
          <p className="mb-0 mt-1 text-body text-ink2">Tổng quan sprint — compose 100% @wakii/ui-kit.</p>
        </div>
        {/* NOTE: không dùng classNames slots trên Button — kit đang leak prop qua
            {...rest} (ButtonClassNames đọc được nhưng không destructure) → warning
            React. Gap ghi vào report cho ui-kit sửa; chỗ slots dùng Layout/Card/Statistic. */}
        <Button
          icon={<Icon name="refresh" size={12} />}
          className="shrink-0"
          loading={!data}
          onClick={() => void load(true)}
        >
          Làm mới
        </Button>
      </div>

      {/* KPI — Row/Col 24-col (1/2/4 cột) + Card loading skeleton + Statistic CountUp.
          Customize pass — Card classNames slots (h-full đều cao + body p-4 dày hơn),
          Statistic classNames.title + valueStyle. */}
      <Row gutter={[24, 24]}>
        {(data?.kpis ?? [null, null, null, null]).map((kpi, i) => (
          <Col key={kpi?.key ?? i} xs={24} sm={12} xl={6}>
            <Card hoverable loading={!kpi} classNames={{ root: 'h-full', body: 'p-4' }}>
              {kpi && (
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-lg ${PILL_CLS[kpi.tone]}`}>
                    <Icon name={kpi.icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* Customize pass — Statistic classNames.title (truncate khi hẹp) */}
                    <Statistic
                      title={kpi.title}
                      value={<CountUp value={kpi.value} decimals={kpi.decimals} duration={1.2} format={(n) => n.toLocaleString('vi-VN')} />}
                      suffix={kpi.unit}
                      classNames={{ title: 'truncate' }}
                    />
                  </div>
                  <span className={`shrink-0 rounded-pill px-1.5 py-0.5 text-[10px] font-medium ${PILL_CLS[kpi.tone]}`}>{kpi.delta}</span>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts — line 7 ngày (2/3) + doughnut phân bố (1/3); mobile stack tự nhiên */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Tiến độ 7 ngày" extra={<Tag>Tuần này</Tag>} className="xl:col-span-2">
          {lineConfig && <Chart config={lineConfig} height={240} />}
        </Card>
        <Card title="Phân bố trạng thái">{doughnutConfig && <Chart config={doughnutConfig} height={240} />}</Card>
      </div>

      {/* Table gần đây (2/3) + cột phải: Timeline + quick-add + presence (1/3) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          title="Tasks gần đây"
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
            loading={loadingDemo || !data}
            emptyMessage={
              <EmptyState
                title="Sprint đã sạch bóng"
                description="Không còn task nào khớp — thêm task nhanh ở card bên phải."
                action={<Button size="small" onClick={() => setEmptyDemo(false)}>Hiện lại</Button>}
              />
            }
            expandable={{
              expandedRowRender: (t) => (
                <div className="text-label text-ink2">
                  Cập nhật {t.updated} · Assignee {t.assignee} · Ưu tiên {t.status === 'fail' ? 'cao' : 'trung bình'}
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

        <div className="flex flex-col gap-6">
          <Card title="Timeline hoạt động" extra={<Tag>real-time</Tag>}>
            <Timeline items={data?.activity ?? []} />
          </Card>

          {/* Quick-add — Field mini → toast + prepend table (parity template §8) */}
          <Card title="Thêm task nhanh">
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                quickAdd();
              }}
            >
              <Field label="Tiêu đề" htmlFor="quick-title">
                <Input
                  id="quick-title"
                  name="title"
                  placeholder="VD: Viết recipe useFieldArray…"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                />
              </Field>
              <div className="flex items-end gap-2">
                <Select
                  ariaLabel="Trạng thái"
                  className="w-32"
                  value={quickStatus}
                  onChange={(v) => setQuickStatus(String(v))}
                  options={QUICK_STATUS_OPTIONS}
                />
                <Button htmlType="submit" type="primary" icon={<Icon name="plus" size={14} />}>
                  Thêm
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Team đang online">
            <div className="flex flex-col gap-3">
              <AvatarGroup items={data?.team ?? []} max={4} size={32} />
              <p className="m-0 text-meta text-ink3">
                {data?.team.length ?? 0} thành viên · 4 đang worklog (presence pill "+2" hover ra tên).
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
