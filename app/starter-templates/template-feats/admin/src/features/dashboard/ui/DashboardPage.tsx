// DashboardPage — UI thuần: KPI row (Statistic + CountUp), Card + Table gần đây,
// Card + Timeline hoạt động. Data demo TĨNH qua props — nối data thật bằng
// useQuery trong DashboardContainer rồi bơm props (không fetch trong ui).
import { Card, Reveal, Statistic, CountUp, Table, Tag, Text, Timeline, type TableColumn } from '@wakii/ui-kit';

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

export interface DashboardPageProps {
  stats: DashboardStats;
  recent: RecentRow[];
  activity: ActivityItem[];
}

const TIMELINE_COLOR = { done: 'var(--st-done)', doing: 'var(--st-doing)', todo: 'var(--ink3)' } as const;

const RECENT_COLUMNS: TableColumn<RecentRow>[] = [
  { key: 'item', title: 'Mục' },
  { key: 'owner', title: 'Người phụ trách' },
  { key: 'status', title: 'Trạng thái', render: (row: RecentRow) => <Tag>{row.status}</Tag> },
];

export function DashboardPage({ stats, recent, activity }: DashboardPageProps) {
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
