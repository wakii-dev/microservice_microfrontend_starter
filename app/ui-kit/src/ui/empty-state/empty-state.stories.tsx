// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './index';

const meta = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;
export default meta;

type Story = StoryObj<typeof meta>;

export const VoiMoTa: Story = {
  args: {
    title: 'Chưa có task nào',
    description: 'Tạo task đầu tiên ở form trên.',
  },
};

export const KhongMoTa: Story = {
  args: { title: 'Chưa có sự kiện nào' },
};
