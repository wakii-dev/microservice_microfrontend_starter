// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './index';

const meta = {
  title: 'Primitives/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: { type: { control: 'select', options: ['success', 'info', 'warning', 'error'] } },
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;

export const BonType: Story = {
  args: { message: 'Alert' },
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <Alert type="success" message="Đã lưu thay đổi." />
      <Alert type="info" message="Dịch vụ xác thực người dùng chưa sẵn sàng — thử lại sau." />
      <Alert type="warning" message="Token sắp hết hạn." />
      <Alert type="error" message="Email hoặc mật khẩu không đúng." />
    </div>
  ),
};

export const CoMoTaVaClose: Story = {
  args: {
    type: 'error',
    message: 'Không kết nối được dịch vụ tasks.',
    description: 'Chi tiết: fetch failed — node-svc (:3001) không phản hồi.',
    closable: true,
  },
};

export const DarkTheme: Story = {
  name: 'Dark theme (filled hex giữ nguyên — WCAG chủ đích)',
  args: { message: 'Alert' },
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <Alert type="success" message="Đã lưu thay đổi." />
        <Alert type="info" message="Dịch vụ xác thực người dùng chưa sẵn sàng — thử lại sau." />
        <Alert type="warning" message="Token sắp hết hạn." />
        <Alert type="error" message="Email hoặc mật khẩu không đúng." />
      </div>
    </div>
  ),
};
