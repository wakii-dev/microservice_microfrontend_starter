// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Statistic (content 24 semibold, title 14 secondary).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Statistic } from './index';

const meta = {
  title: 'Primitives/Statistic',
  component: Statistic,
  tags: ['autodocs'],
} satisfies Meta<typeof Statistic>;
export default meta;

type Story = StoryObj<typeof meta>;

