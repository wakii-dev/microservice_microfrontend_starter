// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Icon } from '../icons/index';
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

function LoadingSwapDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="w-72">
      <Button size="small" onClick={() => setLoading((l) => !l)}>
        {loading ? 'Load content' : 'Reset to skeleton'}
      </Button>
      <div className="mt-3 flex gap-3 rounded-xl border border-line bg-s2 p-4">
        {loading ? (
          <>
            <Skeleton variant="circle" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton variant="text" />
              <Skeleton variant="row" />
            </div>
          </>
        ) : (
          <>
            <div className="grid size-8 shrink-0 place-items-center rounded-pill bg-accent/20 text-accent">
              <Icon name="user" size={16} />
            </div>
            <div>
              <p className="m-0 text-body text-ink">Task title loaded</p>
              <p className="m-0 text-meta text-ink3">Assignee · updated 2m ago</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const LoadingSwap: Story = {
  name: 'Loading — skeleton swaps to real content (toggle)',
  render: () => <LoadingSwapDemo />,
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
