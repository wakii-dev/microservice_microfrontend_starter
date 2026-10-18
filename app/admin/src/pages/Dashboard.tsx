// Dashboard — 4 Statistic cards + Chart line (chart.js) + Timeline hoạt động +
// EmptyState một khu (batch ⑦). Grid responsive 1/2/4 cột.
import { Button, Card, Chart, EmptyState, Icon, Statistic, Tag, Timeline, message, type ChartConfig } from '@wakii-dev/ui-kit';

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-h1 font-semibold text-ink">Dashboard</h1>
        <Button icon={<Icon name="refresh" size={12} />}>Làm mới</Button>
      </div>

      {/* 4 thẻ thống kê — responsive 1/2/4 cột */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title} hoverable>
            <div className="flex items-start justify-between gap-2">
              <Statistic title={stat.title} value={stat.value} />
              <Tag icon={<Icon name={stat.icon} size={12} />}>{stat.tag}</Tag>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Timeline — 2 cột trên màn rộng */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card title="Hoạt động 7 ngày" className="xl:col-span-3">
          {HAS_CHART_DATA ? (
            <div className="h-64">
              <Chart config={CHART_CONFIG} height={256} />
            </div>
          ) : (
            <EmptyState title="Chưa có dữ liệu" description="Chưa có hoạt động nào trong 7 ngày qua." />
          )}
        </Card>
        <Card title="Timeline hoạt động" className="xl:col-span-2">
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
      </div>

      {/* Khu trống — EmptyState với action */}
      <Card>
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
  );
}
