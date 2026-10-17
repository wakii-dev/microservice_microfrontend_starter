import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'row', 'card'] },
    count: { control: { type: 'number', min: 1, max: 8 } },
  },
} satisfies Meta<typeof Skeleton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { variant: 'text' } };
export const Row: Story = { args: { variant: 'row', count: 4 } };
export const Card: Story = { args: { variant: 'card', count: 2 } };
