// Popover stories — triggers (hover/click/focus), placements, controlled, rich content.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Popover } from './index';

const meta = {
  title: 'Primitives/Popover',
  component: Popover,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;
export default meta;

// StoryObj không generic (pattern Popconfirm) — meta có component, story render-only
// thì args không bắt buộc.
type Story = StoryObj;

function ClickDemo({ placement = 'top' }: { placement?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      trigger="click"
      placement={placement}
      title="Popover title"
      content="Click the trigger again or press ESC to close."
      open={open}
      onOpenChange={setOpen}
    >
      <Button onClick={() => setOpen((o) => !o)}>Click me</Button>
    </Popover>
  );
}

export const Basic: Story = {
  name: 'Basic — hover opens the panel (default trigger)',
  render: () => (
    <Popover title="Popover title" content="Free-form body content — not just text like Tooltip.">
      <Button>Hover me</Button>
    </Popover>
  ),
};

export const Placements: Story = {
  name: 'Placement — top (default) & bottom',
  render: () => (
    <div className="flex gap-4">
      <Popover trigger="click" title="Top panel" content="Appears above the trigger (default).">
        <Button>Top (default)</Button>
      </Popover>
      <Popover trigger="click" placement="bottom" title="Bottom panel" content="Appears below the trigger.">
        <Button>Bottom</Button>
      </Popover>
    </div>
  ),
};

export const ClickTrigger: Story = {
  name: 'Trigger click — toggle, ESC and click-outside close',
  render: () => <ClickDemo />,
};

export const FocusTrigger: Story = {
  name: 'Trigger focus — opens on keyboard focus, closes on blur',
  render: () => (
    <Popover trigger="focus" title="Focus panel" content="Opened by focus (Tab) or click on a native button.">
      <Button>Focus/click me</Button>
    </Popover>
  ),
};

export const Controlled: Story = {
  name: 'Controlled — open + onOpenChange from consumer state',
  render: () => <ClickDemo placement="bottom" />,
};

export const RichContent: Story = {
  name: 'Rich content — list + actions inside the panel',
  render: () => (
    <Popover
      trigger="click"
      title="Team members"
      content={
        <div className="flex w-56 flex-col gap-2">
          <div className="flex items-center justify-between">
            <span>Alice</span>
            <span className="text-meta text-ink3">admin</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Bob</span>
            <span className="text-meta text-ink3">member</span>
          </div>
          <Button size="small" type="primary" className="mt-1">
            Invite member
          </Button>
        </div>
      }
    >
      <Button>Open member panel</Button>
    </Popover>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — bg-s2 panel + shadow-pop dark',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Popover title="Dark scope" content="Panel picks up dark tokens automatically.">
        <Button>Hover me (dark)</Button>
      </Popover>
    </div>
  ),
};
