// Parity matrix antd→tokens: docs/parity-matrix.md
// Tooltip stories — placement top/bottom (component supports 2 directions, not 4),
// trigger hover + focus.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Tooltip } from './index';

/** Hover/focus hint bubble — portal-free, wraps the trigger in place. */
const meta = { title: 'Feedback/Tooltip', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  name: 'Placement top (default) — try hovering',
  render: () => (
    <Tooltip title="This tooltip appears above">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  name: 'Placement bottom',
  render: () => (
    <Tooltip title="This tooltip appears below" placement="bottom">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Trigger: Story = {
  name: 'Trigger — hover + focus (keyboard Tab)',
  render: () => (
    <div className="flex gap-4">
      <Tooltip title="Focusable button — Tab here shows the bubble">
        <Button>Focus/hover</Button>
      </Tooltip>
      <Tooltip title="Links receive focus too" placement="bottom">
        <a href="#" className="text-accent no-underline">
          Demo link
        </a>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  name: 'Long content — max-width 250px wrap',
  render: () => (
    <Tooltip title="Long hint text to show wrapping: this task syncs through the gateway, retries 3 times, then parks the event in the DLQ for inspection.">
      <Button>Hover for long hint</Button>
    </Tooltip>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — black bubble same in both themes (antd)',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Tooltip title="Dark scope tooltip">
        <Button>Hover me (dark)</Button>
      </Tooltip>
    </div>
  ),
};

export const RichContent: Story = {
  name: 'Rich content — ReactNode title (strong + accent)',
  render: () => (
    <Tooltip
      title={
        <span>
          <strong className="text-white">Deadline</strong> — syncs through the gateway, retries 3×, then parks in{' '}
          <span className="text-accent">DLQ</span>
        </span>
      }
    >
      <Button>Hover for rich hint</Button>
    </Tooltip>
  ),
};

/** CustomStyled — classNames slots (trigger/bubble) + style passthrough (slots wave 3). */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex gap-6">
      <Tooltip
        title="Bubble gets an accent ring + pill radius"
        classNames={{
          trigger: 'rounded-lg bg-s3 px-1',
          bubble: 'rounded-pill ring-2 ring-accent/40',
        }}
      >
        <Button>classNames slots</Button>
      </Tooltip>
      <Tooltip title="Wrapper carries inline style (padding + dashed outline)" style={{ padding: 4, outline: '2px dashed var(--accent)' }}>
        <Button>style passthrough</Button>
      </Tooltip>
    </div>
  ),
};
