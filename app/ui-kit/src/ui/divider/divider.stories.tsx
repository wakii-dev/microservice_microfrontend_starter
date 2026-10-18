// Parity matrix antd→tokens: docs/parity-matrix.md
// Divider stories — ngang, với text, dashed + vertical.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

const meta = { title: 'Primitives/Divider', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ngang: Story = {
  name: 'Ngang — plain + vertical inline',
  render: () => (
    <div>
      <span>Nội dung trên</span>
      <Divider />
      <span>Nội dung dưới</span>
      <div className="mt-2">
        <span>Trái</span>
        <Divider type="vertical" />
        <span>Giữa</span>
        <Divider type="vertical" />
        <span>Phải</span>
      </div>
    </div>
  ),
};

export const WithText: Story = {
  name: 'WithText — text giữa đường kẻ',
  render: () => (
    <div>
      <span>Phần A</span>
      <Divider>Phần B</Divider>
      <span>Nội dung phần B</span>
    </div>
  ),
};

export const Dashed: Story = {
  name: 'Dashed — ngang + text',
  render: () => (
    <div>
      <span>Nội dung 1</span>
      <Divider dashed />
      <span>Nội dung 2</span>
      <Divider dashed>Viền đứt</Divider>
      <span>Nội dung 3</span>
    </div>
  ),
};
