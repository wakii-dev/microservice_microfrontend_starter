// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Tooltip (bg spotlight rgba(0,0,0,.85), radius 6, arrow 8px).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Tooltip } from './index';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;
export default meta;

type Story = StoryObj<typeof meta>;

