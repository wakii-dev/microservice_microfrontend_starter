// Drawer stories — open/close, footer.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Modal } from '../modal/index';
import { Drawer } from './index';

/** Side panel for detail/forms — portal, focus trap, scroll lock. */
const meta = { title: 'Feedback/Drawer', component: Drawer, tags: ['autodocs'] } satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;
type R = StoryObj;

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} title="Task detail" onClose={() => setOpen(false)} footer={<Button type="primary" onClick={() => setOpen(false)}>Close</Button>}>
        Task detail content — all actions live here.
      </Drawer>
    </>
  );
}

function NoFooterDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open (no footer)</Button>
      <Drawer open={open} title="Read-only detail" onClose={() => setOpen(false)}>
        Scrollable body without the footer action row.
      </Drawer>
    </>
  );
}

function WideDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open 560px drawer</Button>
      <Drawer open={open} title="Wide drawer" width={560} onClose={() => setOpen(false)}>
        Wider panel for form-heavy content.
      </Drawer>
    </>
  );
}

function DarkDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div data-bp-theme="dark" className="p-4">
      <Button type="primary" onClick={() => setOpen(true)}>Open drawer (dark)</Button>
      <Drawer open={open} title="Task detail (dark)" onClose={() => setOpen(false)} footer={<Button type="primary" onClick={() => setOpen(false)}>Close</Button>}>
        Drawer content inside the dark scope.
      </Drawer>
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — open/close + footer',
  args: { open: false, title: 'Task detail' },
  render: () => <Demo />,
};

export const NoFooter: R = {
  name: 'No footer — content only',
  render: () => <NoFooterDemo />,
};

export const Wide: R = {
  name: 'Width — custom 560px (default 378)',
  render: () => <WideDemo />,
};

function CustomStyledDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>Open custom-styled drawer</Button>
      <Drawer
        open={open}
        title="Custom styled"
        onClose={() => setOpen(false)}
        footer={<Button type="primary" onClick={() => setOpen(false)}>Done</Button>}
        classNames={{
          header: 'bg-purple-50 text-purple-700',
          body: 'italic',
          footer: 'border-t-0',
        }}
      >
        Header tinted purple, body italic, footer without its top border — all via classNames slots.
      </Drawer>
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

/** Mission overlay-api — Modal trong Drawer: ESC chỉ đóng overlay TRÊN CÙNG (không cần
 * consumer guard onClose như trước), scroll-lock giữ khi modal con unmount. */
function NestedModalDemo() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        open={open}
        title="Chi tiết hồ sơ"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex gap-2">
            <Button onClick={() => setOpen(false)}>Đóng</Button>
            <Button type="primary" danger onClick={() => setConfirm(true)}>Xoá hồ sơ</Button>
          </div>
        }
      >
        <p>Bấm "Xoá hồ sơ" để mở confirm modal đè lên drawer.</p>
        <p className="mt-2 text-meta text-ink3">
          ESC khi modal mở chỉ đóng modal (overlay trên cùng); ESC kế tiếp mới đóng drawer. Scroll cũng khoá
          tham chiếu — modal con unmount không nhả lock của drawer.
        </p>
        <Modal
          open={confirm}
          title="Xoá hồ sơ?"
          danger
          okText="Xoá"
          onCancel={() => setConfirm(false)}
          onOk={() => setConfirm(false)}
        >
          Hành động không thể hoàn tác.
        </Modal>
      </Drawer>
    </>
  );
}

export const NestedModal: R = {
  name: 'NestedModal — ESC chỉ đóng overlay trên cùng, scroll-lock refcount',
  render: () => <NestedModalDemo />,
};
