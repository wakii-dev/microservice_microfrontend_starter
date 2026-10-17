// Parity matrix antd→tokens: docs/parity-matrix.md
// Card stories — title/extra, hoverable, cover/actions.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './index';
import { Button } from '../button/index';

const meta = { title: 'Data Display/Card', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  name: 'Cơ bản — title + body',
  render: () => (
    <Card title="Task #42" className="w-96">
      Sửa bug đăng nhập trên Safari — token hết hạn không refresh đúng nhánh.
    </Card>
  ),
};

export const TitleExtra: Story = {
  name: 'Title + extra',
  render: () => (
    <Card title="Báo cáo tuần" extra={<span className="text-meta">Cập nhật 5 phút trước</span>} className="w-96">
      12 task hoàn thành, 3 đang chờ review, 1 chặn bởi bug API.
    </Card>
  ),
};

export const Hoverable: Story = {
  name: 'Hoverable — hover lift + shadow (di chuột thử)',
  render: () => (
    <Card hoverable title="Card hoverable" extra={<a href="#" className="text-meta no-underline">Chi tiết</a>} className="w-96">
      Hover lên card — nền s3 + shadow lift, con trỏ pointer (antd hoverable).
      <div className="mt-4 flex gap-2">
        <Button type="primary" size="small">Nhận task</Button>
        <Button size="small">Bỏ qua</Button>
      </div>
    </Card>
  ),
};
