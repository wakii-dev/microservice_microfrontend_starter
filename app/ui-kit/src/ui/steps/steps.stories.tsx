// Parity matrix antd→tokens: docs/parity-matrix.md
// Steps stories — current điều khiển done/current/waiting (chỉ horizontal —
// component chưa có size/vertical prop).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Steps } from './index';

const meta = { title: 'Navigation/Steps', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { title: 'Chọn type', description: 'Loại task' },
  { title: 'Điền form', description: 'Tiêu đề + assignee' },
  { title: 'Xác nhận', description: 'Review tạo task' },
];

export const Basic: Story = {
  name: 'Basic — current giữa',
  render: () => <Steps items={items} current={1} className="max-w-[560px]" />,
};

export const HoanThanh: Story = {
  name: 'Hoàn tất — current cuối',
  render: () => <Steps items={items} current={3} className="max-w-[560px]" />,
};

export const MoTa: Story = {
  name: 'Có description + chưa bắt đầu',
  render: () => (
    <div className="flex flex-col gap-6">
      <Steps items={items} current={2} className="max-w-[560px]" />
      <Steps items={items} current={0} className="max-w-[560px]" />
    </div>
  ),
};
