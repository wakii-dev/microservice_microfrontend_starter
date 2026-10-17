import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;
export default meta;

type Story = StoryObj<typeof meta>;

// label là aria-label BẮT BUỘC (role="status" — màn đọc cần biết busy của cái gì)
export const MacDinh: Story = { args: { label: 'Đang xử lý task viết bài' } };
