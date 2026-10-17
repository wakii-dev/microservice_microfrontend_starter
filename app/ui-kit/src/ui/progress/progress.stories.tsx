// Parity matrix antd→tokens: docs/parity-matrix.md
// Progress stories — line bar (circle là backlog, chưa có prop type khác 'line').
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './index';

const meta = { title: 'Feedback/Progress', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  name: 'Line — các mức percent',
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Progress percent={30} />
      <Progress percent={60} />
      <Progress percent={90} />
    </div>
  ),
};

export const Percent: Story = {
  name: 'Biên 0 / 100 + showInfo=false',
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Progress percent={0} />
      <Progress percent={100} />
      <Progress percent={45} showInfo={false} />
    </div>
  ),
};

export const Status: Story = {
  name: 'Status — success (xanh) / exception (đỏ)',
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Progress percent={100} status="success" />
      <Progress percent={40} status="exception" />
    </div>
  ),
};
