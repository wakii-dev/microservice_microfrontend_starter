// Parity matrix antd→tokens: docs/parity-matrix.md
// Space stories — directions, sizes (small/middle/large/number), wrap.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Space } from './index';

/** Spacing wrapper — horizontal/vertical gap between children. */
const meta = { title: 'Primitives/Space', tags: ['autodocs'] } satisfies Meta;
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

export const Directions: Story = {
  name: 'Directions — horizontal / vertical',
  render: () => (
    <div className="flex flex-col gap-4">
      <Space>
        <Tri />
      </Space>
      <Space direction="vertical" align="start">
        <Button type="primary">Dọc 1</Button>
        <Button>Dọc 2</Button>
      </Space>
    </div>
  ),
};

export const Sizes: Story = {
  name: 'Sizes — small 8 / middle 16 / large 24 / number',
  render: () => (
    <div className="flex flex-col gap-4">
      <Space size="small">
        <Tri />
      </Space>
      <Space size="middle">
        <Tri />
      </Space>
      <Space size="large">
        <Tri />
      </Space>
      <Space size={40}>
        <Tri />
      </Space>
    </div>
  ),
};

export const Wrap: Story = {
  name: 'Wrap — flex-wrap with many items',
  render: () => (
    <Space wrap className="w-96">
      {Array.from({ length: 10 }, (_, i) => (
        <Button key={i}>Nút {i + 1}</Button>
      ))}
    </Space>
  ),
};
