// PARITY: antd Statistic (content 24 semibold, title 14 secondary).
import { Statistic as AntdStatistic, Space as AntdSpace } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Statistic } from './index';

const meta = {
  title: 'Primitives/Statistic',
  component: Statistic,
  tags: ['autodocs'],
} satisfies Meta<typeof Statistic>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  render: () => (
    <Parity
      antd={
        <AntdSpace size={40}>
          <AntdStatistic title="Tổng task" value={42} suffix="việc" />
          <AntdStatistic title="Đang làm" value={7} />
        </AntdSpace>
      }
      ours={
        <div className="flex gap-10">
          <Statistic title="Tổng task" value={42} suffix="việc" />
          <Statistic title="Đang làm" value={7} />
        </div>
      }
    />
  ),
};
