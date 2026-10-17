// Parity matrix antd→tokens: docs/parity-matrix.md
// Space stories (antd Space: small 8/middle 16/large 24).
import type { Meta, StoryObj } from '@storybook/react-vite';
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

