// Parity matrix antd→tokens: docs/parity-matrix.md
// Divider stories — horizontal, with text, dashed + vertical.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

const meta = { title: 'Primitives/Divider', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  name: 'Horizontal — plain + vertical inline',
  render: () => (
    <div>
      <span>Content above</span>
      <Divider />
      <span>Content below</span>
      <div className="mt-2">
        <span>Left</span>
        <Divider type="vertical" />
        <span>Middle</span>
        <Divider type="vertical" />
        <span>Right</span>
      </div>
    </div>
  ),
};

export const WithText: Story = {
  name: 'WithText — text between the lines',
  render: () => (
    <div>
      <span>Section A</span>
      <Divider>Section B</Divider>
      <span>Section B content</span>
    </div>
  ),
};

export const Dashed: Story = {
  name: 'Dashed — horizontal + with text',
  render: () => (
    <div>
      <span>Content 1</span>
      <Divider dashed />
      <span>Content 2</span>
      <Divider dashed>Dashed rule</Divider>
      <span>Content 3</span>
    </div>
  ),
};
