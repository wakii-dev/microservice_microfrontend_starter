// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Statistic (content 24 semibold, title 14 secondary).
// Stories — Basic / PrefixSuffix / ValueStyle / NodeValue / DarkTheme
// + KpiRow (dashboard header: trend badges + 1 ô loading skeleton)
// (component has no loading/disabled prop — don't invent stories).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/index';
import { Skeleton } from '../skeleton/index';
import { Tag } from '../tag/index';
import { Statistic } from './index';

/** Big-number KPI readout — title, value, prefix/suffix. */
const meta = {
  title: 'Data Display/Statistic',
  component: Statistic,
  tags: ['autodocs'],
} satisfies Meta<typeof Statistic>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — title + tabular-nums value',
  render: () => (
    <div className="flex gap-8">
      <Statistic title="Total tasks" value={128} />
      <Statistic title="In progress" value={17} />
      <Statistic title="Overdue" value={3} />
    </div>
  ),
};

export const PrefixSuffix: Story = {
  name: 'Prefix + suffix',
  render: () => (
    <div className="flex gap-8">
      <Statistic title="Revenue" prefix="$" value={1284} suffix="USD" />
      <Statistic title="Progress" value={72} suffix="%" />
    </div>
  ),
};

export const ValueStyle: Story = {
  name: 'valueStyle — color by status',
  render: () => (
    <div className="flex gap-8">
      <Statistic title="Completed" value={92} valueStyle={{ color: 'var(--st-done)' }} />
      <Statistic title="Blocked" value={3} valueStyle={{ color: 'var(--st-fail)' }} />
    </div>
  ),
};

export const NodeValue: Story = {
  name: 'ReactNode value + no title',
  render: () => (
    <div className="flex gap-8">
      <Statistic value={<span>1.2k<i> views</i></span>} />
      <Statistic title="No prefix/suffix" value={0} />
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme — ink/suffix follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="flex gap-8 rounded-xl bg-s2 p-4">
      <Statistic title="Total tasks" value={128} />
      <Statistic title="Overdue" value={3} valueStyle={{ color: 'var(--st-fail)' }} />
      <Statistic title="Revenue" prefix="$" value={1284} suffix="USD" />
    </div>
  ),
};

// ── Real-world 2026-10-25 — KPI row của dashboard header: 4 Statistic với
// trend Badge theo token (doanh thu ↑ xanh, chi phí ↓ xanh — giảm là tốt),
// đơn hàng + completion rate; ô thứ 5 đang fetch → skeleton bones thay số
// (Skeleton component, KHÔNG prop loading — Statistic không có loading).

export const KpiRow: Story = {
  name: 'KPI row — dashboard header with trend badges + loading cell',
  render: () => (
    <div className="rounded-xl border border-line bg-s2 px-6 py-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-body font-semibold text-ink">Store performance</span>
        <Tag>live</Tag>
      </div>
      <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
        <div className="flex flex-col gap-1.5">
          <Statistic prefix="$" title="Revenue" value={128.4} suffix="k" />
          <Badge variant="done">↑ 12.4% vs last month</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <Statistic prefix="$" title="Ad cost" value={18.2} suffix="k" />
          <Badge variant="done">↓ 3.1% — under budget</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <Statistic title="Orders" value={1284} />
          <Badge variant="doing">34 shipping now</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          <Statistic title="Completion rate" value={92} suffix="%" />
          <Badge variant="done">on track</Badge>
        </div>
        {/* Ô đang fetch — skeleton thay số, đúng tỉ lệ title + value */}
        <div aria-busy="true" aria-label="Loading metric" className="flex flex-col gap-2 pt-1">
          <Skeleton className="w-16" variant="text" />
          <Skeleton className="w-24" variant="text" />
        </div>
      </div>
    </div>
  ),
};
