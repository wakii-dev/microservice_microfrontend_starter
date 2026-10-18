// Chart stories — matrix đầy đủ (user yêu cầu "show ĐẦY ĐỦ case"): Line 1/2 dataset,
// Bar đơn/nhóm 3 màu, Pie, Doughnut, Radar, Mixed bar+line, Colors custom, Height,
// Options passthrough + Fallback/EmptyData (edge). Tiêu chuẩn verify: alpha pixel
// canvas > 5% cho mọi story có data (EmptyData trống CÓ CHỦ ĐÍCH, Fallback không canvas).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chart } from './index';
import type { ChartConfig } from './index';

const meta = { title: 'Data Display/Chart', component: Chart, tags: ['autodocs'] } satisfies Meta<typeof Chart>;
export default meta;
type S = StoryObj<typeof meta>;

// Palette ui-kit (tokens light) — story demo màu tường minh, không trích từ token runtime.
const ACCENT = '#5e6ad2';
const ACCENT_HI = '#828fff';
const DOING = '#f2c94c';
const DONE = '#3fb950';
const FAIL = '#f06a6a';
const INK3 = '#8a8f98';

const MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];

/** Bar đơn — 1 dataset, default height 260. */
export const Bar: S = {
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [{ label: 'Doanh thu', data: [12, 19, 3, 15, 9, 17], backgroundColor: ACCENT }],
    },
  },
};

/** Bar nhóm — 3 dataset màu riêng so sánh 3 năm trên cùng labels. */
export const BarNhom: S = {
  name: 'Bar — nhóm 3 dataset',
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [
        { label: '2024', data: [12, 19, 3, 15, 9, 17], backgroundColor: ACCENT },
        { label: '2025', data: [8, 14, 11, 18, 13, 20], backgroundColor: DONE },
        { label: '2026', data: [15, 9, 16, 12, 19, 14], backgroundColor: DOING },
      ],
    },
  },
};

/** Line đơn — 1 dataset có fill nhẹ qua backgroundColor bán phần. */
export const Line: S = {
  args: {
    config: {
      type: 'line',
      labels: MONTHS,
      datasets: [{ label: 'Tăng trưởng', data: [5, 9, 7, 12, 14, 11], borderColor: ACCENT, backgroundColor: 'rgba(94,106,210,0.15)' }],
    },
  },
};

/** Line 2 dataset — so sánh 2 chuỗi trên cùng trục (viền khác màu, no fill). */
export const LineHaiDataset: S = {
  name: 'Line — 2 dataset so sánh',
  args: {
    config: {
      type: 'line',
      labels: MONTHS,
      datasets: [
        { label: 'Node-svc', data: [30, 42, 38, 55, 49, 60], borderColor: ACCENT },
        { label: 'Go-svc', data: [20, 25, 33, 28, 44, 51], borderColor: DONE },
      ],
    },
  },
};

/** Pie — backgroundColor là MẢNG, mỗi slice một màu (cùng độ dài labels). */
export const Pie: S = {
  args: {
    config: {
      type: 'pie',
      labels: ['Todo', 'Đang làm', 'Xong', 'Fail'],
      datasets: [{ label: 'Tasks', data: [8, 5, 11, 2], backgroundColor: [INK3, DOING, DONE, FAIL] }],
    },
  },
};

/** Doughnut — như Pie nhưng lỗ giữa (cutout default chart.js). */
export const Doughnut: S = {
  args: {
    config: {
      type: 'doughnut',
      labels: ['API', 'UI', 'E2E', 'Docs'],
      datasets: [{ label: 'Chi phí', data: [40, 25, 20, 15], backgroundColor: [ACCENT, ACCENT_HI, DOING, INK3] }],
    },
  },
};

/** Radar — 2 dataset đa trục (fill 0.4) + height 320 cho polygon đủ thở. */
export const Radar: S = {
  args: {
    config: {
      type: 'radar',
      labels: ['BE', 'FE', 'E2E', 'Docs', 'DevOps'],
      datasets: [
        { label: 'Team A', data: [8, 9, 6, 4, 5], borderColor: ACCENT, backgroundColor: 'rgba(94,106,210,0.4)' },
        { label: 'Team B', data: [5, 6, 8, 7, 6], borderColor: DONE, backgroundColor: 'rgba(63,185,80,0.4)' },
      ],
    },
  },
  render: (args) => <Chart {...args} height={320} />,
};

/** Mixed — bar + line CÙNG labels (per-dataset type override, chart.js v4). */
export const Mixed: S = {
  name: 'Mixed — bar + line cùng trục',
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [
        { label: 'Task tạo mới', data: [12, 19, 3, 15, 9, 17], backgroundColor: ACCENT },
        { label: 'Task xoá', data: [4, 3, 5, 2, 6, 3], backgroundColor: FAIL },
        { type: 'line', label: 'Tồn cuối kỳ', data: [10, 22, 18, 28, 24, 35], borderColor: DOING },
      ],
    },
  },
};

/** Colors custom — backgroundColor/borderColor truyền tay qua ChartDataset. */
export const ColorsCustom: S = {
  name: 'Colors — custom backgroundColor/borderColor',
  args: {
    config: {
      type: 'bar',
      labels: ['P0', 'P1', 'P2'],
      datasets: [
        {
          label: 'Incidents',
          data: [3, 7, 12],
          backgroundColor: [FAIL, DOING, DONE],
          borderColor: '#1f2328',
          borderWidth: 2,
        },
      ],
    },
  },
};

/** Height — prop `height` (px) điều khiển chiều cao container: 160 vs 400. */
export const Height: S = {
  name: 'Height — 160 vs 400',
  args: { config: { type: 'bar', labels: [], datasets: [] } },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <div className="w-[320px]">
        <p className="m-0 mb-2 font-mono text-meta text-ink3">height=160</p>
        <Chart
          config={{ type: 'bar', labels: MONTHS, datasets: [{ label: 'Thấp', data: [5, 9, 7, 12, 14, 11], backgroundColor: ACCENT_HI }] }}
          height={160}
        />
      </div>
      <div className="w-[320px]">
        <p className="m-0 mb-2 font-mono text-meta text-ink3">height=400</p>
        <Chart
          config={{ type: 'bar', labels: MONTHS, datasets: [{ label: 'Cao', data: [5, 9, 7, 12, 14, 11], backgroundColor: ACCENT }] }}
          height={400}
        />
      </div>
    </div>
  ),
};

/** Options passthrough — config.options truyền thẳng chart.js: legend bottom + trục y beginAtZero. */
export const OptionsPassthrough: S = {
  name: 'Options — legend bottom + y beginAtZero',
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [{ label: 'Đơn hàng', data: [0, 4, 9, 3, 12, 8], backgroundColor: DONE }],
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
      },
    },
  },
};

/** Fallback — chart.js KHÔNG cài / import lỗi → fallback thay canvas. Demo đi ĐÚNG
 * đường failed thật: type lạ + dataset → chart.js throw lúc tra controller →
 * `failed` → fallback render (cần dataset mới chạm controller lookup — type lạ
 * không đủ). */
export const Fallback: S = {
  args: {
    config: {
      type: 'bogus',
      labels: ['a'],
      datasets: [{ label: 'x', data: [1] }],
    } as unknown as ChartConfig,
    fallback: (
      <p className="m-0 grid place-items-center rounded-lg border border-dashed border-line p-6 text-meta text-ink3">
        chart.js chưa cài / init lỗi — đây là fallback thật của component
      </p>
    ),
  },
};

/** EmptyData — labels/datasets rỗng: canvas vẫn mount (chart hợp lệ chưa có data),
 * trống là ĐÚNG — không phải bug vẽ. */
export const EmptyData: S = {
  args: { config: { type: 'line', labels: [], datasets: [] } },
};
