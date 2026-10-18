// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Statistic (content 24 semibold, title 14 secondary).
// Stories — basic, prefix/suffix, valueStyle (component không có prop loading).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Statistic } from './index';

const meta = {
  title: 'Primitives/Statistic',
  component: Statistic,
  tags: ['autodocs'],
} satisfies Meta<typeof Statistic>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — title + value tabular-nums',
  render: () => (
    <div className="flex gap-8">
      <Statistic title="Tổng task" value={128} />
      <Statistic title="Đang làm" value={17} />
      <Statistic title="Trễ hạn" value={3} />
    </div>
  ),
};

export const PrefixSuffix: Story = {
  name: 'Prefix + suffix',
  render: () => (
    <div className="flex gap-8">
      <Statistic title="Doanh thu" prefix="$" value={1284} suffix="USD" />
      <Statistic title="Tiến độ" value={72} suffix="%" />
    </div>
  ),
};

export const ValueStyle: Story = {
  name: 'valueStyle — tô màu theo trạng thái',
  render: () => (
    <div className="flex gap-8">
      <Statistic title="Hoàn thành" value={92} valueStyle={{ color: 'var(--st-done)' }} />
      <Statistic title="Chặn" value={3} valueStyle={{ color: 'var(--st-fail)' }} />
    </div>
  ),
};
