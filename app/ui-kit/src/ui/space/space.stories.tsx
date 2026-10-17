// Space stories (antd Space: small 8/middle 16/large 24).
import { Button as AntdButton, Space as AntdSpace } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Button } from '../button/index';
import { Space } from './index';

const meta = {
  title: 'Primitives/Space',
  component: Space,
  tags: ['autodocs'],
} satisfies Meta<typeof Space>;
export default meta;

type Story = StoryObj<typeof meta>;

function Tri() {
  return (
    <>
      <Button type="primary">A</Button>
      <Button>B</Button>
      <Button type="text">C</Button>
    </>
  );
}

export const ParityVsAntd: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Parity
        antd={
          <AntdSpace>
            <Tri />
          </AntdSpace>
        }
        ours={
          <Space>
            <Tri />
          </Space>
        }
      />
    </div>
  ),
};
