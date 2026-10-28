// DashboardContainer — nối data với DashboardPage. Data demo TĨNH (không cần
// backend cho overlay admin); khi nối API thật: dùng useQuery + shared client
// như feature tasks rồi bơm props — giữ ui/ thuần.
import { DashboardPage } from '../ui/DashboardPage';
import type { ActivityItem, DashboardStats, RecentRow, WeeklyPoint } from '../ui/DashboardPage';

const STATS: DashboardStats = {
  users: 128,
  tasks: 42,
  completionRate: 87,
  revenue: 96,
};

const WEEKLY: WeeklyPoint[] = [
  { day: 'Mon', value: 12 },
  { day: 'Tue', value: 19 },
  { day: 'Wed', value: 8 },
  { day: 'Thu', value: 22 },
];

const RECENT: RecentRow[] = [
  { id: 1, item: 'Triển khai bản tuần này', owner: 'Alice', status: 'đang chạy' },
  { id: 2, item: 'Review thiết kế dashboard', owner: 'Bob', status: 'chờ duyệt' },
  { id: 3, item: 'Nối API thống kê', owner: 'Carol', status: 'xong' },
  { id: 4, item: 'Sửa bug đăng nhập', owner: 'David', status: 'xong' },
];

const ACTIVITY: ActivityItem[] = [
  { id: 1, text: 'Alice đã gán task "Triển khai bản tuần này"', time: '10 phút trước', tone: 'doing' },
  { id: 2, text: 'Carol xoá xong bug đăng nhập', time: '1 giờ trước', tone: 'done' },
  { id: 3, text: 'Backup CSDL hàng tuần hoàn tất', time: '3 giờ trước', tone: 'done' },
  { id: 4, text: '2 mời hợp tác đang chờ phản hồi', time: 'Hôm qua', tone: 'todo' },
];

export function DashboardContainer() {
  return <DashboardPage stats={STATS} weekly={WEEKLY} recent={RECENT} activity={ACTIVITY} />;
}
