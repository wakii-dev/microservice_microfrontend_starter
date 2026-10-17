// Drawer stories — open/close, footer.
import { useState } from 'react';
import { Drawer as AntdDrawer, Button as AntdButton } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
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
function AntdDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AntdButton type="primary" onClick={() => setOpen(true)}>Mở drawer</AntdButton>
      <AntdDrawer open={open} title="Chi tiết task" onClose={() => setOpen(false)} footer={<AntdButton type="primary" onClick={() => setOpen(false)}>Đóng</AntdButton>}>
        Nội dung chi tiết task — mọi thao tác tại đây.
      </AntdDrawer>
    </>
  );
}

export const ParityVsAntd: Story = {
  args: { open: false, title: 'Chi tiết task' },
  render: () => (
    <Parity antd={<AntdDemo />} ours={<Demo />} />
  ),
};
