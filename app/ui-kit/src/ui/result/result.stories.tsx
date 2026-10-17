// Result stories — success/404/500.
import { Result as AntdResult, Button as AntdButton } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Button } from '../button/index';
import { Result } from './index';

const meta = { title: 'Feedback/Result', component: Result, tags: ['autodocs'] } satisfies Meta<typeof Result>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Parity
        antd={<AntdResult status="success" title="Đặt hàng thành công" extra={<AntdButton type="primary">Tiếp tục</AntdButton>} />}
        ours={<Result status="success" title="Đặt hàng thành công" extra={<Button type="primary">Tiếp tục</Button>} />}
      />
      <Parity
        antd={<AntdResult status="404" title="404" subTitle="Trang không tồn tại" />}
        ours={<Result status="404" title="404" subTitle="Trang không tồn tại" />}
      />
    </div>
  ),
};
