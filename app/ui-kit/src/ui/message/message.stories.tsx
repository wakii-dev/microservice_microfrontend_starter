import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { message } from './index';

const meta = {
  title: 'Primitives/Message',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const BonType: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" onClick={() => message.success('Đã xoá task')}>
        success
      </Button>
      <Button onClick={() => message.info('Đã đồng bộ feed')}>info</Button>
      <Button onClick={() => message.warning('Token sắp hết hạn')}>warning</Button>
      <Button type="primary" danger onClick={() => message.error('Không kết nối được node-svc')}>
        error
      </Button>
    </div>
  ),
};
