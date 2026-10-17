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

function Demo({ danger }: { danger?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" danger={danger} onClick={() => setOpen(true)}>
        {danger ? 'Xoá task' : 'Mở modal'}
      </Button>
      <Modal
        open={open}
        title="Xoá task này?"
        danger={danger}
        okText={danger ? 'Xác nhận xoá' : 'OK'}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        {danger ? 'Hành động không thể hoàn tác.' : 'Nội dung modal demo.'}
      </Modal>
    </>
  );
}

export const XacNhanXoa: Story = {
  args: { open: false, title: 'Xoá task này?' },
  render: () => <Demo danger /> };
export const CoBan: Story = {
  args: { open: false, title: 'Modal' },
  render: () => <Demo /> };
