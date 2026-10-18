// Popconfirm stories — confirm (danger) + cancel/ESC.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Popconfirm } from './index';

const meta = {
  title: 'Primitives/Popconfirm',
  component: Popconfirm,
  tags: ['autodocs'],
} satisfies Meta<typeof Popconfirm>;
export default meta;

type Story = StoryObj<typeof meta>;
type R = StoryObj;

function DeleteDemo({ danger }: { danger?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Popconfirm
      open={open}
      title="Delete this task?"
      description="This action cannot be undone."
      danger={danger}
      okText="Delete"
      onConfirm={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    >
      <Button type="primary" danger={danger} onClick={() => setOpen((o) => !o)}>
        Delete task
      </Button>
    </Popconfirm>
  );
}

function SendDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Popconfirm open={open} title="Send report?" okText="Send" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)}>
      <Button onClick={() => setOpen((o) => !o)}>Send report</Button>
    </Popconfirm>
  );
}

export const Basic: Story = {
  name: 'Basic — controlled open + description',
  args: { open: true, title: 'Delete this task?', children: 'x' },
  render: () => <DeleteDemo />,
};

export const Danger: Story = {
  name: 'Danger — red icon + red OK button',
  args: { open: true, title: 'Delete this task?', children: 'x', danger: true },
  render: () => <DeleteDemo danger />,
};

export const NoDescription: R = {
  name: 'No description — question only',
  render: () => <SendDemo />,
};

export const DarkTheme: R = {
  name: 'DarkTheme — bubble bg-s2 + shadow-pop dark',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Popconfirm open title="Delete this task?" description="This action cannot be undone (dark scope)." danger okText="Delete">
        <Button type="primary" danger>Delete task</Button>
      </Popconfirm>
    </div>
  ),
};
