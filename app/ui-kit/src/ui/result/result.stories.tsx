// Parity matrix antd→tokens: docs/parity-matrix.md
// Result stories — success/error/404 (icon theo status; không có prop custom icon).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Result } from './index';
import { Button } from '../button/index';

const meta = { title: 'Feedback/Result', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  name: 'Success — + extra actions',
  render: () => (
    <Result
      status="success"
      title="Tạo task thành công"
      subTitle="Task FE-42 đã vào backlog sprint 12."
      extra={<Button type="primary">Xem task</Button>}
    />
  ),
};

export const Error: Story = {
  name: 'Error — lỗi gán assignee',
  render: () => (
    <Result
      status="error"
      title="Gán thất bại"
      subTitle="fail@demo.local không nhận được task — sự kiện đã vào DLQ."
      extra={<Button>Thử lại</Button>}
    />
  ),
};

export const KhongTimThay: Story = {
  name: '404 — Không tìm thấy trang',
  render: () => (
    <Result
      status="404"
      title="404"
      subTitle="Trang bạn tìm không tồn tại hoặc đã bị xoá."
      extra={<Button type="primary">Về trang chủ</Button>}
    />
  ),
};
