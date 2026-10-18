// Dashboard — MỘT THỂ THỐNG NHẤT (vision-audit coordinator 2026-10-18).
// ANCHOR = chart card: Card (bg-s2 + border-line + rounded-3 + body p-6, header
// title + extra phải). Mọi khối theo anchor đó:
// - Stat cards: cùng Card, nội dung icon size-10 (accent/10) + label text-ink2 +
//   số text-2xl font-semibold + delta pill nhỏ thống nhất (không Statistic/Tag rời rạc)
// - Nhịp dọc: MỘT scale gap-6 giữa mọi hàng (hết mt-4/mt-6 lẫn lộn)
// - Cột phải: Timeline + EmptyState stacked flex-1 — hai card CAO ĐỀU
// - Headers: chart + timeline cùng pattern title trái + Tag phải
// Grid responsive 1/2/4 cột stats; chart 3/5 + phải 2/5 trên xl.
import { Button, Card, Chart, EmptyState, Icon, Tag, Timeline, message, type ChartConfig } from '@wakii/ui-kit';

const STATS = [
  { title: 'Người dùng', value: '1.284', tag: '+12%', icon: 'users' as const },
  { title: 'Tasks đang mở', value: '316', tag: '+5%', icon: 'check-circle' as const },
  { title: 'File upload', value: '89', tag: '+23%', icon: 'upload' as const },
  { title: 'Uptime', value: '99,98%', tag: 'SLA', icon: 'info-circle' as const },
];

// ⚠️ SHAPE NATIVE chart.js v4 — ui-kit <Chart> pass config THẲNG vào `new ChartJs(canvas, config)`,
// nên data phải LỒNG trong `data: {labels, datasets}`. Interface ChartConfig flat của ui-kit
// (labels/datasets top-level, như stories họ viết) → chart.js đọc config.data = undefined →
// chart RỖNG im lặng (probe diagnose-chart.mjs: instance attached + sized nhưng labels:0,
// datasets:[], 0 pixel). Cast qua unknown vì type ui-kit đang khai báo flat — flag coordinator.
const CHART_CONFIG_NATIVE = {
  type: 'line' as const,
  data: {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Tasks',
        data: [12, 19, 8, 22, 30, 25, 18],
        borderColor: '#1677ff',
        backgroundColor: 'rgba(22,119,255,0.12)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Uploads',
        data: [4, 7, 3, 9, 12, 8, 6],
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82,196,26,0.12)',
        tension: 0.35,
        fill: true,
      },
    ],
  },
  // animation:false — render đồng bộ lúc constructor, không phụ thuộc rAF (headless/tab
  // background vẫn vẽ đúng frame đầu)
  options: { responsive: true, maintainAspectRatio: false, animation: false },
};

// Cast tại biên JSX — type flat của ui-kit chưa phản ánh shape native chart.js (xác trên)
const CHART_CONFIG = CHART_CONFIG_NATIVE as unknown as ChartConfig;

const HAS_CHART_DATA = CHART_CONFIG_NATIVE.data.datasets.some((dataset) => dataset.data.length > 0);

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-h1 font-semibold text-ink">Dashboard</h1>
        <Button icon={<Icon name="refresh" size={12} />}>Làm mới</Button>
      </div>

      {/* 4 stat cards — cùng anchor Card; icon + label + số + delta pill đồng bộ */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title} hoverable>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"
              >
                <Icon name={stat.icon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-body text-ink2">{stat.title}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-semibold leading-tight text-ink">{stat.value}</span>
                  <span className="rounded-pill bg-st-done/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-st-done">
                    {stat.tag}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart (3/5 trái) + cột phải 2/5: Timeline trên + EmptyState dưới — flex-1
          mỗi card = CAO ĐỀU (grid rows fr/fr tương đương) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Card title="Hoạt động 7 ngày" extra={<Tag>Tuần này</Tag>} className="xl:col-span-3">
          {HAS_CHART_DATA ? (
            <div className="h-64">
              <Chart config={CHART_CONFIG} height={256} />
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu" description="Chưa có hoạt động nào trong 7 ngày qua." />
          )}
        </Card>
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Timeline hoạt động" extra={<Tag>real-time</Tag>} className="flex-1">
            <Timeline
              items={[
                {
                  key: 't1',
                  children: 'Alice Nguyen tạo task "Sửa bug login"',
                  label: '10 phút trước',
                },
                {
                  key: 't2',
                  color: 'var(--st-done)',
                  children: 'Bot sync Kafka — 24 events đã xử lý',
                  label: '1 giờ trước',
                },
                {
                  key: 't3',
                  children: 'Bob Tran upload 3 file vào "Báo cáo Q4"',
                  label: '3 giờ trước',
                },
                {
                  key: 't4',
                  color: 'var(--st-fail)',
                  children: 'Saga gán task thất bại — DLQ có message mới',
                  label: 'Hôm qua',
                },
              ]}
            />
          </Card>
          <Card className="flex-1">
            <EmptyState
              title="Chưa có báo cáo tuần"
              description="Báo cáo sẽ tự sinh vào mỗi sáng thứ Hai, hoặc tạo ngay bây giờ."
              action={
                <Button type="primary" onClick={() => message.info('Tạo báo cáo (demo)')}>
                  Tạo báo cáo
                </Button>
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
