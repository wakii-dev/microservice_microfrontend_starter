// Backdrop stories — scrim over live content; click to dismiss.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.js';
import { Spinner } from '../spinner/index.js';
import { Backdrop } from './index';

const meta = { title: 'Theming & Motion/Backdrop', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — scrim over a content grid; click it to dismiss (state is yours). */
export const Basic: Story = {
  name: 'Basic — click-to-dismiss scrim',
  render: () => <BasicDemo />,
};

/** WithSpinner — children slot centers a busy indicator above the scrim. */
export const WithSpinner: Story = {
  name: 'With Spinner — busy overlay',
  render: () => <SpinnerDemo />,
};

function ContentGrid() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-lg border border-line bg-s1 p-4 text-body text-ink2">
          Card {i + 1}
        </div>
      ))}
    </div>
  );
}

function BasicDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative max-w-xl">
      <ContentGrid />
      <Backdrop open={open} onClick={() => setOpen(false)} />
      <div className="mt-4">
        <Button onClick={() => setOpen(true)} disabled={open}>
          Show scrim
        </Button>
      </div>
    </div>
  );
}

function SpinnerDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="relative max-w-xl">
      <ContentGrid />
      <Backdrop open={open} onClick={() => setOpen(false)}>
        <Spinner label="Loading content" size="large" color="inverse" />
      </Backdrop>
      <div className="mt-4">
        <Button onClick={() => setOpen(true)} disabled={open}>
          Replay busy state
        </Button>
      </div>
    </div>
  );
}
