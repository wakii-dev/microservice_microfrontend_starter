// Parity matrix antd→tokens: docs/parity-matrix.md
// Card stories — title/extra, hoverable, cover/actions, borderless, dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './index';
import { Button } from '../button/index';
import { Tag } from '../tag/index';

const meta = { title: 'Data Display/Card', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — title + body',
  render: () => (
    <Card title="Task #42" className="w-96">
      Fix the Safari login bug — expired token not refreshed on the right branch.
    </Card>
  ),
};

export const TitleExtra: Story = {
  name: 'Title + extra',
  render: () => (
    <Card title="Weekly report" extra={<span className="text-meta">Updated 5 minutes ago</span>} className="w-96">
      12 tasks completed, 3 awaiting review, 1 blocked by an API bug.
    </Card>
  ),
};

export const Hoverable: Story = {
  name: 'Hoverable — hover lift + shadow (try hovering)',
  render: () => (
    <Card hoverable title="Hoverable card" extra={<a href="#" className="text-meta no-underline">Details</a>} className="w-96">
      Hover the card — s3 background + lift shadow, pointer cursor (antd hoverable).
      <div className="mt-4 flex gap-2">
        <Button type="primary" size="small">Take task</Button>
        <Button size="small">Skip</Button>
      </div>
    </Card>
  ),
};

export const Borderless: Story = {
  name: 'Borderless — bordered=false (stands out on canvas)',
  render: () => (
    <div className="flex gap-4">
      <Card title="With border" className="w-72">bordered=true by default.</Card>
      <Card title="Without border" bordered={false} className="w-72">bg-s2 container without border — best placed on canvas background.</Card>
    </div>
  ),
};

export const Cover: Story = {
  name: 'Cover — image above the head',
  render: () => (
    <Card
      title="Deploy WEEK-42"
      extra={<Tag>production</Tag>}
      cover={<div className="h-32 bg-gradient-to-r from-accent to-accent-hi" />}
      className="w-96"
    >
      Cover renders before the head — a full-width banner on top of the card.
    </Card>
  ),
};

export const Actions: Story = {
  name: 'Actions — button row below the body (border-l separators)',
  render: () => (
    <Card
      title="Task #42"
      actions={[
        <Button key="1" type="text" size="small">Take task</Button>,
        <Button key="2" type="text" size="small">Skip</Button>,
        <Button key="3" type="text" size="small" danger>Report blocker</Button>,
      ]}
      className="w-96"
    >
      Actions is a ReactNode array — flex-1 equal widths, separated by border-l.
    </Card>
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <Card
        title="Task #42"
        extra={<span className="text-meta">5 minutes ago</span>}
        hoverable
        actions={[<Button key="1" type="text" size="small">Take task</Button>, <Button key="2" type="text" size="small">Skip</Button>]}
      >
        Card on dark canvas — dark bg-s2, dark border-line, hover lift unchanged.
      </Card>
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: loading + size) ──

export const Loading: Story = {
  name: 'Loading — skeleton body while data fetches',
  render: () => (
    <Card title="Task #42" loading className="w-96">
      This body is hidden while loading — skeleton text/row bones render instead.
    </Card>
  ),
};

export const SmallSize: Story = {
  name: 'Small size — dense padding (antd size="small")',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Card title="Default" extra={<span className="text-meta">24px</span>} className="w-72">
        Padding 24 — antd default size.
      </Card>
      <Card title="Small" extra={<span className="text-meta">12px</span>} size="small" className="w-72">
        Padding 12 — antd size="small" for dense dashboards.
      </Card>
    </div>
  ),
};
