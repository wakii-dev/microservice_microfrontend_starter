// Progress stories — % thường/100/exception.
import { Progress as AntdProgress } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Progress } from './index';

const meta = { title: 'Feedback/Progress', component: Progress, tags: ['autodocs'] } satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  args: { percent: 42 },
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
      <Parity antd={<AntdProgress percent={42} />} ours={<Progress percent={42} />} />
      <Parity antd={<AntdProgress percent={100} />} ours={<Progress percent={100} />} />
      <Parity antd={<AntdProgress percent={30} status="exception" />} ours={<Progress percent={30} status="exception" />} />
    </div>
  ),
};
