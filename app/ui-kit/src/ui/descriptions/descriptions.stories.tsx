// Descriptions stories — bordered/plain.
import { Descriptions as AntdDescriptions } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Descriptions } from './index';

const meta = { title: 'Data Display/Descriptions', component: Descriptions, tags: ['autodocs'] } satisfies Meta<typeof Descriptions>;
export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { label: 'Người tạo', children: 'Alice' },
  { label: 'Trạng thái', children: 'Đang làm' },
  { label: 'Hạn', children: '2026-10-20' },
];

export const ParityVsAntd: Story = {
  args: { items: ITEMS, bordered: true },
  render: () => (
    <Parity
      antd={<AntdDescriptions title="Chi tiết task" bordered items={[{ key: '1', label: 'Người tạo', children: 'Alice' }]} />}
      ours={<Descriptions title="Chi tiết task" bordered items={ITEMS} />}
    />
  ),
};
