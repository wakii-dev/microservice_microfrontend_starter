// Notification stories — static API demo (parity antd Notification: top-right).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button as AntdButton, notification as AntdNotification } from 'antd';
import { Button } from '../button/index';
import { notification } from './index';
import { Parity } from '../../../.storybook/Parity';

const meta = { title: 'Feedback/Notification', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const BonType: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" onClick={() => notification.success('Đồng bộ thành công', 'Feed đã cập nhật')}>
        success
      </Button>
      <Button onClick={() => notification.info('Có bản cập nhật mới')}>info</Button>
      <Button onClick={() => notification.warning('Token sắp hết hạn')}>warning</Button>
      <Button type="primary" danger onClick={() => notification.error('Đồng bộ thất bại', 'node-svc không phản hồi')}>
        error
      </Button>
    </div>
  ),
};
export const ParityVsAntd: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Parity antd={<AntdButton onClick={() => AntdNotification.success({ message: 'Đồng bộ thành công', description: 'Feed đã cập nhật' })}>antd success</AntdButton>} ours={<Button onClick={() => notification.success('Đồng bộ thành công', 'Feed đã cập nhật')}>ours success</Button>} />
    </div>
  ),
};
