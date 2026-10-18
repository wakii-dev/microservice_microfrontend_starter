// Motion Showcase — quay toàn bộ animation của ui-kit 1 chỗ (motion identity).
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../ui/button/index';
import { Modal } from '../ui/modal/index';
import { Drawer } from '../ui/drawer/index';
import { notification } from '../ui/notification/index';
import { message } from '../ui/message/index';
import { Spinner as SpinnerComp } from '../ui/spinner/index';
import { Switch } from '../ui/switch/index';

const meta = { title: 'Theming & Motion/Motion Showcase', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function OverlayDemo() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" onClick={() => setModal(true)}>Modal zoom</Button>
      <Button onClick={() => setDrawer(true)}>Drawer slide</Button>
      <Button onClick={() => notification.info('Slide-in phải →')}>Notification</Button>
      <Button onClick={() => message.success('Toast fade-up')}>Message</Button>
      <Modal open={modal} title="Zoom + fade" onCancel={() => setModal(false)} onOk={() => setModal(false)}>
        Đóng = zoom-out + fade (exit nhanh hơn enter 30%).
      </Modal>
      <Drawer open={drawer} title="Slide drawer" onClose={() => setDrawer(false)}>
        Đóng = slide-out phải (exit animation).
      </Drawer>
    </div>
  );
}

function SpinnerMatrix() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      {(['ring', 'dots', 'bars'] as const).map((v) => (
        <div key={v} style={{ textAlign: 'center' }}>
          <SpinnerComp label={`spinner-${v}`} variant={v} />
          <div style={{ fontSize: 12, marginTop: 4 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function ToggleDemo() {
  const [on, setOn] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Switch checked={on} onChange={setOn} checkedChildren="Bật" unCheckedChildren="Tắt" />
      <span style={{ fontSize: 12 }}>Spring toggle</span>
    </div>
  );
}

export const NenTang: Story = {
  name: 'Overlay + Feedback',
  render: () => <OverlayDemo />,
};
export const SpinnerVariants: Story = { name: 'Spinner variants', render: () => <SpinnerMatrix /> };
export const Toggle: Story = { render: () => <ToggleDemo /> };
