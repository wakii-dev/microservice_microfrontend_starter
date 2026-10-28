// DashboardPage — UI thuần: KPI row (Statistic + CountUp), Card chart "Weekly
// throughput" (subpath @wakii/ui-kit/chart), Card + Table gần đây, Card + Timeline
// hoạt động. Data demo TĨNH qua props — nối data thật bằng useQuery trong
// DashboardContainer rồi bơm props (không fetch trong ui).
import { Card, Reveal, Statistic, CountUp, Table, Tag, Text, Timeline, type TableColumn } from '@wakii/ui-kit';
import { Chart } from '@wakii/ui-kit/chart';

export interface ActivityItem {
  id: number;
  text: string;
  time: string;
  tone: 'done' | 'doing' | 'todo';
}

export interface DashboardStats {
  users: number;
  tasks: number;
  completionRate: number;
  revenue: number;
}

export interface RecentRow {
  id: number;
  item: string;
  owner: string;
  status: string;
}

export interface WeeklyPoint {
  day: string;
  value: number;
}

export interface DashboardPageProps {
  stats: DashboardStats;
  weekly: WeeklyPoint[];
  recent: RecentRow[];
  activity: ActivityItem[];
}

const TIMELINE_COLOR = { done: 'var(--st-done)', doing: 'var(--st-doing)', todo: 'var(--ink3)' } as const;

const RECENT_COLUMNS: TableColumn<RecentRow>[] = [
  { key: 'item', title: 'Mục' },
  { key: 'owner', title: 'Người phụ trách' },
  { key: 'status', title: 'Trạng thái', render: (row: RecentRow) => <Tag>{row.status}</Tag> },
];

export function DashboardPage({ stats, weekly, recent, activity }: DashboardPageProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI row — CountUp đếm số khi vào viewport */}
      <Reveal>
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <Card>
            <Statistic title="Người dùng" value={<CountUp value={stats.users} />} suffix="+" />
          </Card>
          <Card>
            <Statistic title="Tasks đang mở" value={<CountUp value={stats.tasks} />} />
          </Card>
          <Card>
            <Statistic title="Hoàn thành" value={<CountUp value={stats.completionRate} />} suffix="%" />
          </Card>
          <Card>
            <Statistic title="Doanh thu tháng" value={<CountUp value={stats.revenue} />} suffix="tr" />
          </Card>
        </div>
      </Reveal>

      {/* Weekly throughput — bar qua subpath @wakii/ui-kit/chart (peer chart.js do
          overlay _deps.json khai báo). Không truyền màu → kit tự resolve token theo
          theme (light/dark live). animation:false — render đồng bộ. */}
      <Card title="Weekly throughput">
        <div className="h-64">
          <Chart
            config={{
              type: 'bar',
              labels: weekly.map((w) => w.day),
              datasets: [{ label: 'Tasks completed', data: weekly.map((w) => w.value) }],
              options: { responsive: true, maintainAspectRatio: false, animation: false },
            }}
            height={256}
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Gần đây" className="lg:col-span-2">
          <Table columns={RECENT_COLUMNS} dataSource={recent} rowKey="id" />
        </Card>
        <Card title="Hoạt động">
          <Timeline
            items={activity.map((a) => ({
              key: String(a.id),
              label: <Text type="secondary">{a.time}</Text>,
              color: TIMELINE_COLOR[a.tone],
              children: <Text>{a.text}</Text>,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
