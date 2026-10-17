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

function OursDemo({ danger }: { danger?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Popconfirm
      open={open}
      title="Xoá task này?"
      description="Hành động không thể hoàn tác."
      danger={danger}
      okText="Xác nhận xoá"
      onConfirm={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    >
      <Button type="primary" danger={danger} onClick={() => setOpen((o) => !o)}>
        Xoá task
      </Button>
    </Popconfirm>
  );
}

export const XacNhanXoa: Story = {
  args: { open: true, title: 'Xoá task này?', children: 'x' },
  render: () => <OursDemo />,
};
export const DangerIcon: Story = {
  args: { open: true, title: 'Xoá task này?', children: 'x', danger: true },
  render: () => <OursDemo danger />,
};
