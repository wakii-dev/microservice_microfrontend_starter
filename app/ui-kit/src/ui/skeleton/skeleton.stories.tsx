// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './index';

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'row', 'card', 'circle', 'button'] },
    count: { control: { type: 'number', min: 1, max: 8 } },
  },
} satisfies Meta<typeof Skeleton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Text: Story = { name: 'Text — single line', args: { variant: 'text' } };
export const Row: Story = { name: 'Row — count 4', args: { variant: 'row', count: 4 } };
export const Card: Story = { name: 'Card — count 2', args: { variant: 'card', count: 2 } };

export const CircleButton: Story = {
  name: 'Circle + Button — avatar/button placeholder',
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton variant="circle" />
      <Skeleton variant="button" />
    </div>
  ),
};

export const Composite: Story = {
  name: 'Composite — content card loading (circle + text + rows)',
  render: () => (
    <div className="flex w-72 gap-3 rounded-xl border border-line bg-s2 p-4">
      <Skeleton variant="circle" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton variant="text" />
        <Skeleton variant="row" />
        <Skeleton variant="row" count={2} />
      </div>
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — dark bg-s3 bone',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <div className="w-64">
        <Skeleton variant="row" count={3} />
      </div>
    </div>
  ),
};

export const CustomStyled: Story = {
  name: 'CustomStyled — classNames slots merge after defaults',
  args: { variant: 'row' },
  render: () => (
    <div className="w-72">
      <Skeleton
        variant="row"
        count={2}
        classNames={{ wrapper: 'gap-4', bone: 'bg-accent/20' }}
      />
    </div>
  ),
};
