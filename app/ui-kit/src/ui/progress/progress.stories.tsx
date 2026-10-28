// Parity matrix antd→tokens: docs/parity-matrix.md
// Progress stories — line bar + circle arc (type='line' | 'circle').
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './index';

/** Line progress bar — percent, status colors, clamped 0–100. */
const meta = { title: 'Feedback/Progress', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  name: 'Line — percent levels',
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Progress percent={30} />
      <Progress percent={60} />
      <Progress percent={90} />
    </div>
  ),
};

export const Bounds: Story = {
  name: 'Bounds — 0 / 100 + showInfo=false + clamp',
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Progress percent={0} />
      <Progress percent={100} />
      <Progress percent={45} showInfo={false} />
      <Progress percent={150} />
      <Progress percent={-20} />
    </div>
  ),
};

export const Status: Story = {
  name: 'Status — success (green) / exception (red)',
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Progress percent={100} status="success" />
      <Progress percent={80} status="success" />
      <Progress percent={40} status="exception" />
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — trail line2 + status colors dark',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <div className="flex w-96 flex-col gap-3">
        <Progress percent={60} />
        <Progress percent={100} status="success" />
        <Progress percent={25} status="exception" />
      </div>
    </div>
  ),
};

/** CustomStyled — classNames slots (root/track/bar/info) + style passthrough (slots wave 3). */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <Progress
        percent={64}
        style={{ padding: 4 }}
        classNames={{
          root: 'rounded-lg bg-s3 p-1',
          track: 'h-3',
          bar: 'rounded-pill',
          info: 'font-semibold text-accent',
        }}
      />
      <Progress percent={90} status="success" classNames={{ track: 'h-1.5', info: 'text-label' }} />
    </div>
  ),
};

/* ── Circle (MUI/antd parity) — type="circle": SVG dash arc, status strokes ── */

export const Circle: Story = {
  name: 'Circle — percent levels',
  render: () => (
    <div className="flex items-center gap-4">
      <Progress type="circle" percent={30} ariaLabel="Loading 30 percent" />
      <Progress type="circle" percent={60} ariaLabel="Loading 60 percent" />
      <Progress type="circle" percent={90} ariaLabel="Loading 90 percent" />
    </div>
  ),
};

export const CircleStatuses: Story = {
  name: 'Circle — normal / success / exception',
  render: () => (
    <div className="flex items-center gap-4">
      <Progress type="circle" percent={45} />
      <Progress type="circle" percent={100} status="success" />
      <Progress type="circle" percent={30} status="exception" />
    </div>
  ),
};

export const CircleIndeterminate: Story = {
  name: 'Circle — indeterminate (spin; reduced-motion static quarter arc)',
  render: () => <Progress type="circle" indeterminate ariaLabel="Loading" />,
};

export const CircleSizes: Story = {
  name: 'Circle — sizes 24 / 40 / 64 px',
  render: () => (
    <div className="flex items-center gap-4">
      <Progress type="circle" percent={65} size={24} />
      <Progress type="circle" percent={65} size={40} />
      <Progress type="circle" percent={65} size={64} />
    </div>
  ),
};

export const CircleNoInfo: Story = {
  name: 'Circle — showInfo=false',
  render: () => <Progress type="circle" percent={70} showInfo={false} />,
};
