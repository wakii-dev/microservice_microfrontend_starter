// Chart stories — full case matrix: Line 1/2 datasets, single/grouped Bar, Pie,
// Doughnut, Radar, Mixed bar+line, Colors custom, Height, Options passthrough +
// Fallback/EmptyData (edges). Verify standard: canvas alpha > 5% for every story
// with data (EmptyData is intentionally blank, Fallback has no canvas).
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { UiKitProvider } from '../../provider/index.js';
import { Chart, useChartTheme } from './index';
import type { ChartConfig } from './index';

const meta = { title: 'Data Display/Chart', component: Chart, tags: ['autodocs'] } satisfies Meta<typeof Chart>;
export default meta;
type S = StoryObj<typeof meta>;

// ui-kit palette (light tokens) — explicit demo colors, not runtime tokens.
const ACCENT = '#5e6ad2';
const ACCENT_HI = '#828fff';
const DOING = '#f2c94c';
const DONE = '#3fb950';
const FAIL = '#f06a6a';
const INK3 = '#8a8f98';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

/** Single Bar — 1 dataset, default height 260. */
export const Bar: S = {
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [{ label: 'Revenue', data: [12, 19, 3, 15, 9, 17], backgroundColor: ACCENT }],
    },
  },
};

/** Grouped Bar — 3 colored datasets comparing 3 years on shared labels. */
export const BarGrouped: S = {
  name: 'Bar — grouped 3 datasets',
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

/** Single Line — 1 dataset with a soft area fill via semi-transparent backgroundColor. */
export const Line: S = {
  args: {
    config: {
      type: 'line',
      labels: MONTHS,
      datasets: [{ label: 'Growth', data: [5, 9, 7, 12, 14, 11], borderColor: ACCENT, backgroundColor: 'rgba(94,106,210,0.15)' }],
    },
  },
};

/** Two-series Line — compare 2 series on one axis (distinct borders, no fill). */
export const LineTwoDatasets: S = {
  name: 'Line — 2 datasets compared',
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

/** Pie — backgroundColor is an ARRAY, one color per slice (same length as labels). */
export const Pie: S = {
  args: {
    config: {
      type: 'pie',
      labels: ['Todo', 'In progress', 'Done', 'Failed'],
      datasets: [{ label: 'Tasks', data: [8, 5, 11, 2], backgroundColor: [INK3, DOING, DONE, FAIL] }],
    },
  },
};

/** Doughnut — same as Pie with a center hole (chart.js default cutout). */
export const Doughnut: S = {
  args: {
    config: {
      type: 'doughnut',
      labels: ['API', 'UI', 'E2E', 'Docs'],
      datasets: [{ label: 'Cost', data: [40, 25, 20, 15], backgroundColor: [ACCENT, ACCENT_HI, DOING, INK3] }],
    },
  },
};

/** Radar — 2 multi-axis datasets (0.4 fill) + height 320 so the polygon breathes. */
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

/** Mixed — bar + line on SHARED labels (per-dataset type override, chart.js v4). */
export const Mixed: S = {
  name: 'Mixed — bar + line on one axis',
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [
        { label: 'Tasks created', data: [12, 19, 3, 15, 9, 17], backgroundColor: ACCENT },
        { label: 'Tasks deleted', data: [4, 3, 5, 2, 6, 3], backgroundColor: FAIL },
        { type: 'line', label: 'End-of-period stock', data: [10, 22, 18, 28, 24, 35], borderColor: DOING },
      ],
    },
  },
};

/** Colors custom — hand-set backgroundColor/borderColor via ChartDataset. */
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

/** Height — the `height` prop (px) controls the container height: 160 vs 400. */
export const Height: S = {
  name: 'Height — 160 vs 400',
  args: { config: { type: 'bar', labels: [], datasets: [] } },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <div className="w-[320px]">
        <p className="m-0 mb-2 font-mono text-meta text-ink3">height=160</p>
        <Chart
          config={{ type: 'bar', labels: MONTHS, datasets: [{ label: 'Short', data: [5, 9, 7, 12, 14, 11], backgroundColor: ACCENT_HI }] }}
          height={160}
        />
      </div>
      <div className="w-[320px]">
        <p className="m-0 mb-2 font-mono text-meta text-ink3">height=400</p>
        <Chart
          config={{ type: 'bar', labels: MONTHS, datasets: [{ label: 'Tall', data: [5, 9, 7, 12, 14, 11], backgroundColor: ACCENT }] }}
          height={400}
        />
      </div>
    </div>
  ),
};

/** Options passthrough — config.options goes straight to chart.js: bottom legend + y beginAtZero. */
export const OptionsPassthrough: S = {
  name: 'Options — legend bottom + y beginAtZero',
  args: {
    config: {
      type: 'bar',
      labels: MONTHS,
      datasets: [{ label: 'Orders', data: [0, 4, 9, 3, 12, 8], backgroundColor: DONE }],
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
      },
    },
  },
};

/** Fallback — chart.js NOT installed / import error → fallback replaces the canvas.
 * Walks the component's REAL failed path: unknown type + dataset → chart.js throws
 * during controller lookup → `failed` → fallback renders (a dataset is needed to
 * reach the controller lookup — unknown type alone is not enough). */
export const Fallback: S = {
  args: {
    config: {
      type: 'bogus',
      labels: ['a'],
      datasets: [{ label: 'x', data: [1] }],
    } as unknown as ChartConfig,
    fallback: (
      <p className="m-0 grid place-items-center rounded-lg border border-dashed border-line p-6 text-meta text-ink3">
        chart.js not installed / init error — this is the component's real fallback
      </p>
    ),
  },
};

/** EmptyData — empty labels/datasets: canvas still mounts (a valid chart with no
 * data yet); blank is CORRECT behavior — not a rendering bug. */
export const EmptyData: S = {
  args: { config: { type: 'line', labels: [], datasets: [] } },
};

/** DarkTheme — chart on a dark canvas (chart.js default grey legend/ticks stay legible).
 * Dataset colors are the explicit demo palette — kept for both themes. */
export const DarkTheme: S = {
  name: 'Dark theme — doughnut on dark canvas',
  args: {
    config: {
      type: 'doughnut',
      labels: ['Todo', 'In progress', 'Done', 'Failed'],
      datasets: [{ label: 'Tasks', data: [8, 5, 11, 2], backgroundColor: [INK3, DOING, DONE, FAIL] }],
    },
  },
  render: (args) => (
    <div data-bp-theme="dark" className="w-[420px] rounded-xl bg-canvas p-4">
      <Chart {...args} height={280} />
    </div>
  ),
};

/** DarkToggleLive — useChartTheme resolves token colors inside the UiKitProvider
 * scope; toggling re-resolves → config JSON changes → Chart re-inits with the new
 * palette WITHOUT remount (F2: dark-toggle live, 0 extra props on Chart). */
export const DarkToggleLive: S = {
  // render demo tự quản config qua useChartTheme — args chỉ để thỏa config required
  args: { config: { type: 'line', labels: [], datasets: [] } },
  render: () => <ChartThemeDemo />,
};

const THEME_VARS = { accent: '--accent', done: '--st-done' } as const;
const THEME_FALLBACK = { accent: '#1677ff', done: '#52c41a' };

function ChartThemeDemo() {
  const [dark, setDark] = useState(false);
  const { ref, colors } = useChartTheme(THEME_VARS, THEME_FALLBACK);
  const config = useMemo<ChartConfig>(
    () => ({
      type: 'line',
      labels: MONTHS,
      datasets: [
        { label: 'Accent', data: [12, 19, 3, 15, 9, 17], borderColor: colors.accent, backgroundColor: colors.accent, borderWidth: 2 },
        { label: 'Done', data: [7, 11, 5, 13, 8, 14], borderColor: colors.done, backgroundColor: colors.done, borderWidth: 2 },
      ],
      options: { responsive: true, maintainAspectRatio: false },
    }),
    [colors],
  );
  return (
    <UiKitProvider theme={dark ? 'dark' : 'light'}>
      {/* Probe token trong đúng scope theme — attr đổi trên wrapper provider nằm trong subtree body */}
      <span ref={ref} aria-hidden="true" className="hidden" />
      <div className="grid w-full max-w-2xl gap-3 rounded-xl bg-canvas p-4">
        <Button className="w-fit" onClick={() => setDark((d) => !d)}>
          {dark ? 'Switch to light' : 'Switch to dark'} (live)
        </Button>
        <Chart config={config} height={240} />
        <p className="m-0 font-mono text-meta text-ink3">
          resolved: accent <strong className="text-ink">{colors.accent}</strong> · done{' '}
          <strong className="text-ink">{colors.done}</strong>
        </p>
      </div>
    </UiKitProvider>
  );
}

/** CustomStyled — slots-wave classNames + style: `root` on the container div,
 * `canvas` on the chart canvas; `style` merges after height/position. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  args: {
    classNames: { root: 'rounded-xl border border-dashed border-accent p-3', canvas: 'rounded-lg' },
    style: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' },
    config: {
      type: 'bar',
      labels: ['Mon', 'Tue', 'Wed'],
      datasets: [{ label: 'Tasks', data: [12, 19, 7] }],
    },
  },
};
