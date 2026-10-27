// Mock fetch cho Dashboard — admin demo KHÔNG có api thật nên fetch mô phỏng
// latency + shape typed đủ thật (KPI/chart series/tasks/activity/team) để tầng UI
// consume như data thật: load useEffect → skeleton Card loading + Table loading.
// Dữ liệu flavor theo boilerplate (sprint, Kafka outbox, saga DLQ) như kit templates.
import type { IconName } from '@wakii/ui-kit';

export type KpiTone = 'accent' | 'done' | 'doing' | 'fail';

export interface KpiItem {
  key: string;
  title: string;
  value: number;
  decimals: number;
  unit: string;
  delta: string;
  tone: KpiTone;
  icon: IconName;
}

export type TaskStatus = 'todo' | 'doing' | 'done' | 'fail';

export interface RecentTask {
  id: number;
  title: string;
  status: TaskStatus;
  assignee: string;
  hours: number;
  updated: string;
}

export interface ActivityEvent {
  key: string;
  children: string;
  label: string;
  color?: string;
}

export interface TeamMember {
  name: string;
  fallback: string;
}

export interface DashboardData {
  kpis: KpiItem[];
  /** Series tuần — dataset màu resolve lúc render qua useChartPalette (không hex cứng). */
  weekly: { labels: string[]; closed: number[]; created: number[] };
  distribution: { done: number; doing: number; todo: number; fail: number };
  tasks: RecentTask[];
  activity: ActivityEvent[];
  team: TeamMember[];
}

const DASHBOARD_MOCK: DashboardData = {
  kpis: [
    { key: 'closed', title: 'Tasks đóng tuần này', value: 1284, decimals: 0, unit: '', delta: '+12%', tone: 'done', icon: 'check-circle' },
    { key: 'open', title: 'Tasks đang mở', value: 316, decimals: 0, unit: '', delta: '+5%', tone: 'doing', icon: 'clock' },
    { key: 'worklog', title: 'Giờ worklog tuần', value: 128.5, decimals: 1, unit: 'h', delta: 'đúng tiến độ', tone: 'accent', icon: 'users' },
    { key: 'dlq', title: 'Gán thất bại → DLQ', value: 7, decimals: 0, unit: '', delta: '−2', tone: 'fail', icon: 'exclamation-triangle' },
  ],
  weekly: {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    closed: [12, 19, 8, 22, 30, 25, 18],
    created: [8, 12, 14, 10, 18, 9, 5],
  },
  distribution: { done: 42, doing: 18, todo: 27, fail: 7 },
  tasks: [
    { id: 101, title: 'Migration design tokens', status: 'done', assignee: 'Alice', hours: 12.5, updated: '2 giờ trước' },
    { id: 102, title: 'Gateway CORS whitelist', status: 'doing', assignee: 'Bob', hours: 6, updated: '1 giờ trước' },
    { id: 103, title: 'Outbox publisher retry', status: 'doing', assignee: 'Carol', hours: 8, updated: '30 phút trước' },
    { id: 104, title: 'Saga compensation test', status: 'todo', assignee: 'Alice', hours: 0, updated: 'hôm qua' },
    { id: 105, title: 'DLQ alert threshold', status: 'fail', assignee: 'fail@demo.local', hours: 3.5, updated: '3 giờ trước' },
    { id: 106, title: 'Storybook dark docs', status: 'done', assignee: 'Bob', hours: 5, updated: 'hôm qua' },
    { id: 107, title: 'Timesheet grid parity', status: 'doing', assignee: 'Carol', hours: 9, updated: '5 giờ trước' },
    { id: 108, title: 'Smoke e2e 2 chiều', status: 'done', assignee: 'Alice', hours: 4, updated: '2 ngày trước' },
  ],
  activity: [
    { key: 'a1', children: 'Alice gán "Gateway CORS" cho Bob', label: '5 phút trước' },
    { key: 'a2', color: 'var(--st-done)', children: 'PR #55 (parity wave) — 1119 tests xanh', label: '1 giờ trước' },
    { key: 'a3', color: 'var(--st-fail)', children: 'Saga gán thất bại → task-events.dlq', label: '2 giờ trước' },
    { key: 'a4', children: 'Bot sync Kafka event task.updated', label: '3 giờ trước' },
  ],
  team: [
    { name: 'Alice Nguyễn', fallback: 'AN' },
    { name: 'Bob Trần', fallback: 'BT' },
    { name: 'Carol Lê', fallback: 'CL' },
    { name: 'David Phạm', fallback: 'DP' },
    { name: 'Hoi Vu', fallback: 'HV' },
    { name: 'Mai Võ', fallback: 'MV' },
  ],
};

/** GET /api/dashboard (demo) — latency giả ~150ms để UI đi qua skeleton/loading thật. */
export async function fetchDashboard(): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  // Clone sâu để refresh tạo object mới — CountUp animate lại từ số đang hiển thị.
  return structuredClone(DASHBOARD_MOCK);
}
