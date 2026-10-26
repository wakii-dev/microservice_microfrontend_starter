// Popover stories — triggers (hover/click/focus), placements, controlled, rich content.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Popover } from './index';

/** Floating panel anchored to a trigger — rich content slot. */
const meta = {
  title: 'Feedback/Popover',
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

/** Mission overlay-api — placement left/right + auto-flip sát mép viewport (đo trước paint). */
export const AutoFlip: Story = {
  name: 'Auto-flip + left/right — panel sát mép viewport tự lật',
  render: () => (
    <div className="flex min-h-40 items-center justify-between gap-4">
      <Popover
        trigger="click"
        placement="right"
        title="Bên phải trigger"
        content="Panel bên phải — nếu tràn mép phải viewport thì tự lật sang trái."
      >
        <Button>Mép trái → right</Button>
      </Popover>
      <Popover
        trigger="click"
        placement="top"
        title="Trên trigger"
        content="Panel phía trên — nếu đè mép trên viewport thì tự lật xuống dưới."
      >
        <Button>Giữa trang → top</Button>
      </Popover>
      <Popover
        trigger="click"
        placement="left"
        title="Bên trái trigger"
        content="Panel bên trái — nếu tràn mép trái viewport thì tự lật sang phải."
      >
        <Button>Mép phải → left</Button>
      </Popover>
    </div>
  ),
};

/** CustomStyled — classNames slots (root/trigger/panel) + style passthrough (slots wave 3). */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex gap-6">
      <Popover
        trigger="click"
        title="Themed panel"
        content="Panel gets an accent border via the panel slot."
        classNames={{
          root: 'rounded-xl',
          trigger: 'rounded-lg',
          panel: 'border-accent ring-2 ring-accent/20',
        }}
      >
        <Button>classNames slots</Button>
      </Popover>
      <Popover title="Styled root" content="The root wrapper carries inline style." style={{ padding: 4, outline: '2px dashed var(--accent)' }}>
        <Button>style passthrough</Button>
      </Popover>
    </div>
  ),
};
