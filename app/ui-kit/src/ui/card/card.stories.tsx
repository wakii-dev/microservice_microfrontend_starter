// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Card (radiusLG 8, head border-b, body padding 24, hoverable shadow).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './index';

const meta = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

