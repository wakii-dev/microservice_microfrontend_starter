// Steps stories — current giữa + description.
import { Steps as AntdSteps } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Steps } from './index';

const meta = { title: 'Navigation/Steps', component: Steps, tags: ['autodocs'] } satisfies Meta<typeof Steps>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  args: { items: [], current: 0 },
  render: () => (
    <Parity
      antd={
        <AntdSteps
          current={1}
          items={[
            { title: 'Đặt hàng', description: 'Giỏ hàng' },
            { title: 'Thanh toán' },
            { title: 'Hoàn tất' },
          ]}
        />
      }
      ours={
        <Steps
          current={1}
          items={[
            { title: 'Đặt hàng', description: 'Giỏ hàng' },
            { title: 'Thanh toán' },
            { title: 'Hoàn tất' },
          ]}
        />
      }
    />
  ),
};
