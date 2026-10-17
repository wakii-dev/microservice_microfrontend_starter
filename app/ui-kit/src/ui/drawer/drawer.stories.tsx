// Drawer stories — open/close, footer.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Drawer } from './index';

const meta = { title: 'Feedback/Drawer', component: Drawer, tags: ['autodocs'] } satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>Mở drawer</Button>
      <Drawer open={open} title="Chi tiết task" onClose={() => setOpen(false)} footer={<Button type="primary" onClick={() => setOpen(false)}>Đóng</Button>}>
        Nội dung chi tiết task — mọi thao tác tại đây.
      </Drawer>
    </>
  );
}

export const CoBan: Story = {
  args: { open: false, title: 'Chi tiết task' },
  render: () => <Demo />,
};
