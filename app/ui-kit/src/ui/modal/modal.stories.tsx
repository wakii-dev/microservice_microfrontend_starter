// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Modal } from './index';

const meta = {
  title: 'Primitives/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;
export default meta;

type Story = StoryObj<typeof meta>;
type R = StoryObj;

function Demo({ danger }: { danger?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" danger={danger} onClick={() => setOpen(true)}>
        {danger ? 'Delete task' : 'Open modal'}
      </Button>
      <Modal
        open={open}
        title="Delete this task?"
        danger={danger}
        okText={danger ? 'Delete' : 'OK'}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        {danger ? 'This action cannot be undone.' : 'Modal demo content.'}
      </Modal>
    </>
  );
}

function LoadingDemo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Open with loading
      </Button>
      <Modal
        open={open}
        title="Archive sprint?"
        confirmLoading={loading}
        onOk={() => {
          setLoading(true);
          window.setTimeout(() => {
            setLoading(false);
            setOpen(false);
          }, 1200);
        }}
        onCancel={() => setOpen(false)}
      >
        Both buttons lock while confirmLoading — OK shows "Đang xử lý…".
      </Modal>
    </>
  );
}

function DarkDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div data-bp-theme="dark" className="p-4">
      <Button type="primary" onClick={() => setOpen(true)}>Open modal (dark)</Button>
      <Modal open={open} title="Delete this task?" danger okText="Delete" onOk={() => setOpen(false)} onCancel={() => setOpen(false)}>
        This action cannot be undone (dark scope).
      </Modal>
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — confirm dialog',
  args: { open: false, title: 'Modal' },
  render: () => <Demo />,
};

export const Danger: Story = {
  name: 'Danger — red OK for destructive actions',
  args: { open: false, title: 'Delete this task?' },
  render: () => <Demo danger />,
};

export const Loading: Story = {
  name: 'Loading — confirmLoading locks buttons, OK shows spinner text',
  args: { open: false, title: 'Archive sprint?' },
  render: () => <LoadingDemo />,
};

function CustomStyledDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>Open custom-styled modal</Button>
      <Modal
        open={open}
        title="Custom styled"
        okText="Confirm"
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        classNames={{
          header: 'text-purple-700',
          body: 'italic',
          footer: 'border-t border-line2 pt-3',
          closeButton: 'text-purple-500',
        }}
      >
        Header tinted purple, body italic, footer gains a top separator — all via classNames slots.
      </Modal>
    </>
  );
}

export const CustomStyled: R = {
  name: 'CustomStyled — classNames slots (antd v5 style)',
  render: () => <CustomStyledDemo />,
};

export const DarkTheme: R = {
  name: 'DarkTheme — panel bg-s2 + mask dark',
  render: () => <DarkDemo />,
};
