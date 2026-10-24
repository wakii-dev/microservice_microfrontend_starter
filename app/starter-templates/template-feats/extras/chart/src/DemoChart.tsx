// Overlay EXTRA: chart — trang demo <Chart> qua subpath '@wakii/ui-kit/chart'
// (engine thêm route '/chart' trỏ vào component này + chèn dep bên dưới).
// ⚠️ PEER DEP — CLI thêm vào dependencies khi chọn extra này:
//   "chart.js": "^4.5.1"
// Chart lazy-import chart.js lúc runtime; CHƯA cài → hiện fallback message,
// không crash (peer-dep pattern của kit).
import { Chart } from '@wakii/ui-kit/chart';
import { Text, Title } from '@wakii/ui-kit';

/* Flat config — chart.js v4 qua wrapper của kit (component cũng hiểu shape
 * native nested; flat là shape type khai báo). animation:false — render đồng
 * bộ, không phụ thuộc rAF. Màu mặc định kit tự resolve theo theme light/dark. */
const CHART_CONFIG = {
  type: 'line' as const,
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Tasks completed',
      data: [12, 19, 8, 22, 30, 25, 18],
      tension: 0.35,
      fill: true,
    },
    {
      label: 'Reviews',
      data: [4, 7, 3, 9, 12, 8, 6],
      tension: 0.35,
      fill: true,
    },
  ],
  options: { responsive: true, maintainAspectRatio: false, animation: false },
};

/** Route gợi ý cho engine: '/chart'. */
export function ChartDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Title level={2}>Chart</Title>
      <Text type="secondary">
        chart.js v4 wrapped by the kit — theme-aware colors, responsive inside a fixed-height container.
      </Text>
      {/* Container height chuẩn — chart.js responsive khỏi init 0×0 (comment source kit) */}
      <div className="h-64">
        <Chart config={CHART_CONFIG} height={256} />
      </div>
    </div>
  );
}
