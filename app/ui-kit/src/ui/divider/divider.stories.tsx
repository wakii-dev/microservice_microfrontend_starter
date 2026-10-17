// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Divider (margin 16px 0, dashed, with-text) vs ours.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

const meta = {
  title: 'Primitives/Divider',
  component: Divider,
  tags: ['autodocs'],
} satisfies Meta<typeof Divider>;
export default meta;

type Story = StoryObj<typeof meta>;

