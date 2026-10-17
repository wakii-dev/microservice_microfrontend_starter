// Popconfirm — PARITY với antd Popconfirm (icon warning, small buttons).
import { useState } from 'react';
import { Popconfirm as AntdPopconfirm, Button as AntdButton } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
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

export const ParityVsAntd: Story = {
  render: () => (
    <Parity
      antd={
        <AntdPopconfirm title="Xoá task này?" okText="Xác nhận xoá">
          <AntdButton danger>Xoá task</AntdButton>
        </AntdPopconfirm>
      }
      ours={<OursDemo />}
    />
  ),
};
