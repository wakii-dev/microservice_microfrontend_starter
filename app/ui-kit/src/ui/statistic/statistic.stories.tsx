// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Statistic (content 24 semibold, title 14 secondary).
// Stories — Basic / PrefixSuffix / ValueStyle / NodeValue / DarkTheme
// (component has no loading/disabled prop — don't invent stories).
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
