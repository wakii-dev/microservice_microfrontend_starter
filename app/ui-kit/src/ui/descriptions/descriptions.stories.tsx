// Parity matrix antd→tokens: docs/parity-matrix.md
// Descriptions stories — basic + bordered variant + no-title + long value + dark.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Descriptions } from './index';

/** Label:value readout grid for entity detail views. */
const meta = { title: 'Data Display/Descriptions', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { label: 'Task', children: 'FE-42 — Fix Safari login bug' },
  { label: 'Assignee', children: 'alice@demo.local' },
  { label: 'Status', children: 'Doing' },
  { label: 'Due', children: '10/18/2026' },
];

export const Basic: Story = {
  name: 'Basic — label : value',
  render: () => <Descriptions title="Task info" items={items} className="w-[520px]" />,
};

export const Bordered: Story = {
  name: 'Bordered — fully ruled cells',
  render: () => <Descriptions title="Task info" items={items} bordered className="w-[520px]" />,
};

export const NoTitle: Story = {
  name: 'No title — bare dl rows (embed inside another panel)',
  render: () => <Descriptions items={items.slice(0, 2)} className="w-[520px]" />,
};

export const LongValue: Story = {
  name: 'Long value — wraps in dd, label fixed at w-40',
  render: () => (
    <Descriptions
      title="Bug report"
      items={[
        { label: 'Summary', children: 'Expired token does not refresh on the right branch — the refresh call still sends the old access token in the header, the gateway rejects with 401, then the FE wipes the login session instead of retrying once.' },
        { label: 'Due', children: '10/18/2026' },
      ]}
      className="w-[520px]"
    />
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-[520px] rounded-xl bg-canvas p-4">
      <Descriptions title="Task info" items={items} bordered />
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: size + colon) ──

export const SizeAndColon: Story = {
  name: 'Size small + colon — dense rows with label colons',
  render: () => (
    <div className="w-[520px]">
      <Descriptions title="Small + colon" items={items} size="small" colon />
    </div>
  ),
};
