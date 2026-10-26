// Parity matrix antd→tokens: docs/parity-matrix.md
// BusyBox stories — busy/idle toggle.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { BusyBox } from './index';

/** Compact busy indicator — spinner + label in one line. */
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

/** CustomStyled — slots-wave classNames + style: `root` lands on the wrapper
 * div (both busy and idle branches); `style` merges on the same element. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  args: {
    busy: true,
    variant: 'card',
    count: 2,
    children: <p className="text-body text-ink">Loaded content with slotted wrapper</p>,
    classNames: { root: 'rounded-xl border border-dashed border-accent bg-accent/5 p-3' },
    style: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' },
  },
};
