// BusyBox stories — busy/idle toggle.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { BusyBox } from './index';

const meta = { title: 'Primitives/BusyBox', component: BusyBox, tags: ['autodocs'] } satisfies Meta<typeof BusyBox>;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [busy, setBusy] = useState(true);
  return (
    <div style={{ maxWidth: 480 }}>
      <Button onClick={() => setBusy((b) => !b)}>Toggle busy</Button>
      <div style={{ marginTop: 16 }}>
        <BusyBox busy={busy} variant="row" count={3}>
          <p>Nội dung đã tải — không skeleton.</p>
        </BusyBox>
      </div>
    </div>
  );
}

export const Toggle: Story = {
  args: { busy: true, children: 'x' },
  render: () => <Demo />,
};
