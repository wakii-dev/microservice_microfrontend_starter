// Overlay EXTRA: chart — trang demo <Chart> qua subpath '@wakii/ui-kit/chart'.
// ⚠️ PEER DEP: "chart.js": "^4.5.1" (kit lazy-import; thiếu → fallback, không crash).
// Redesign 2026-10-25: 3 chart (mixed bar+line / radar / line area) + KPI strip,
// màu mặc định kit tự resolve theo theme light/dark.
import { Card, CountUp, Statistic, Text, Title } from '@wakii/ui-kit';
import { Chart } from '@wakii/ui-kit/chart';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

/* Flat config — chart.js v4 qua wrapper kit. animation:false — render đồng bộ.
 * Bỏ qua backgroundColor/borderColor → kit gán màu token theo theme (live theo
 * dark toggle nhờ MutationObserver trong useChartTheme). */
const THROUGHPUT = {
  type: 'bar' as const,
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    { type: 'line' as const, label: 'Tasks completed', data: [12, 19, 8, 22, 30, 25, 18], tension: 0.35, fill: true },
    { type: 'bar' as const, label: 'Reviews', data: [4, 7, 3, 9, 12, 8, 6] },
  ],
  options: { responsive: true, maintainAspectRatio: false, animation: false },
};

const FOCUS = {
  type: 'radar' as const,
  labels: ['Speed', 'Quality', 'Docs', 'Tests', 'Focus', 'Collab'],
  datasets: [
    { label: 'This sprint', data: [7, 8.5, 6, 9, 7.5, 8] },
    { label: 'Last sprint', data: [6, 7.5, 5, 7, 8, 6.5] },
  ],
  options: { responsive: true, maintainAspectRatio: false, animation: false },
};

const BURNDOWN = {
  type: 'line' as const,
  labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T'],
  datasets: [
    { label: 'Open tasks', data: [40, 36, 33, 27, 22, 18, 15, 11, 6, 0], tension: 0.35, fill: true },
    { label: 'Ideal', data: [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0], borderDash: [6, 4], fill: false },
  ],
  options: { responsive: true, maintainAspectRatio: false, animation: false },
};

/** Route gợi ý cho engine: '/chart'. */
export function ChartDemo() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>Extra · chart.js</span>
        <Title level={1}>Charts that follow your theme</Title>
        <div className="max-w-2xl">
          <Text type="secondary">
            chart.js v4 wrapped by the kit — mixed datasets, radar and area lines. Colors resolve from design
            tokens and re-render live when you flip light/dark.
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 rounded-xl border border-line bg-s1 px-8 py-6 shadow-[var(--shadow-lift)] max-sm:grid-cols-1 max-sm:gap-6">
        <Statistic title="Tasks shipped" value={<CountUp value={134} />} />
        <Statistic title="Review rate" value={<CountUp value={92} />} suffix="%" />
        <Statistic title="Avg cycle time" value={<CountUp value={2.4} decimals={1} />} suffix="d" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Weekly throughput">
          <div className="h-64">
            <Chart config={THROUGHPUT} height={256} />
          </div>
        </Card>
        <Card title="Team focus — this vs last sprint">
          <div className="h-64">
            <Chart config={FOCUS} height={256} />
          </div>
        </Card>
      </div>

      <Card title="Release burndown">
        <div className="h-56">
          <Chart config={BURNDOWN} height={224} />
        </div>
      </Card>
    </div>
  );
}
