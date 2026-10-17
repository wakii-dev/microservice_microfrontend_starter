import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './index';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['primary', 'default', 'text'] },
    htmlType: { control: 'select', options: ['button', 'submit', 'reset'] },
    danger: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const CacType: Story = {
  args: { children: 'Button' },
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary">Tạo task</Button>
      <Button>Tải thêm</Button>
      <Button type="text">Huỷ</Button>
      <Button type="primary" disabled>
        Disabled
      </Button>
    </div>
  ),
};

export const NguoiDung: Story = {
  name: 'Danger',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" danger>
        Xác nhận xoá
      </Button>
      <Button type="text" danger>
        Xoá
      </Button>
    </div>
  ),
};
