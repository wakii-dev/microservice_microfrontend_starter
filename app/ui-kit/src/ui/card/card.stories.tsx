// PARITY: antd Card (radiusLG 8, head border-b, body padding 24, hoverable shadow).
import { Card as AntdCard } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Card } from './index';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  render: () => (
    <Parity
      antd={
        <AntdCard title="Card tiêu đề" extra={<a>Thêm</a>} style={{ width: 300 }}>
          Nội dung card — padding 24, head border-b.
        </AntdCard>
      }
      ours={
        <Card title="Card tiêu đề" extra={<a>Thêm</a>} className="w-[300px]">
          Nội dung card — padding 24, head border-b.
        </Card>
      }
    />
  ),
};
