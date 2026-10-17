// Parity matrix antd→tokens: docs/parity-matrix.md
// Descriptions stories — basic + bordered variant.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Descriptions } from './index';

const meta = { title: 'Data Display/Descriptions', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { label: 'Task', children: 'FE-42 — Sửa bug đăng nhập' },
  { label: 'Assignee', children: 'alice@demo.local' },
  { label: 'Trạng thái', children: 'Doing' },
  { label: 'Hạn', children: '18/10/2026' },
];

export const Basic: Story = {
  name: 'Basic — label : value',
  render: () => <Descriptions title="Thông tin task" items={items} className="w-[520px]" />,
};

export const Border: Story = {
  name: 'Bordered — cell viền kín',
  render: () => <Descriptions title="Thông tin task" items={items} bordered className="w-[520px]" />,
};
