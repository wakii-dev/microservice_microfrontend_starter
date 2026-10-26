// Popconfirm stories — confirm (danger) + cancel/ESC.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Popconfirm } from './index';

/** Confirm bubble anchored to a trigger — ESC = cancel. */
const meta = {
  title: 'Feedback/Popconfirm',
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

/** CustomStyled — slots-wave classNames + style: `root` lands on the relative
 * trigger wrapper, `bubble` on the absolute anchor, `dialog` on the card
 * itself; `style` lands on the wrapper. */
export const CustomStyled: R = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Popconfirm
      open
      title="Deploy to production?"
      description="Slots restyle the bubble without touching the arrow."
      danger
      okText="Deploy"
      classNames={{
        root: 'rounded-xl',
        bubble: 'drop-shadow-lg',
        dialog: 'border-dashed border-accent bg-accent/5',
      }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
    >
      <Button type="primary" danger>Deploy</Button>
    </Popconfirm>
  ),
};
