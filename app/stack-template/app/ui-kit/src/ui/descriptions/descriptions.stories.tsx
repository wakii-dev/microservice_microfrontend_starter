// Parity matrix antd→tokens: docs/parity-matrix.md
// Descriptions stories — basic + bordered variant + no-title + long value + dark
// + ProfileCard (hồ sơ người dùng với actions).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/index';
import { Button } from '../button/index';
import { Card } from '../card/index';
import { Tag } from '../tag/index';
import { Descriptions } from './index';

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

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

// ── Real-world 2026-10-25 — profile card: head avatar + tên + role pill, thân
// là Descriptions bordered 6 trường hồ sơ, actions row Sửa / Vô hiệu hoá —
// trang chi tiết user như trong mọi admin console.

export const ProfileCard: Story = {
  name: 'Profile card — user detail with header and actions',
  render: () => (
    <Card
      actions={[
        <Button key="edit" size="small" type="primary">Edit profile</Button>,
        <Button key="deactivate" size="small" danger>Deactivate</Button>,
      ]}
      className="w-[520px]"
      title={
        <span className="flex items-center gap-3">
          <Avatar alt="Mai Tran" size={40} src={photo('mai-avatar', 80, 80)} />
          <span className="flex flex-col">
            <span className="text-body font-semibold text-ink">Mai Tran</span>
            <span className="text-meta text-ink3">Product designer · Design Platform</span>
          </span>
        </span>
      }
      extra={<Tag>Active</Tag>}
    >
      <Descriptions
        bordered
        colon
        items={[
          { label: 'Email', children: 'mai.tran@wakii.dev' },
          { label: 'Role', children: 'Product designer' },
          { label: 'Team', children: 'Design Platform' },
          { label: 'Joined', children: 'Mar 3, 2025' },
          { label: 'Manager', children: 'Alice Nguyen' },
          { label: 'Last active', children: '10 minutes ago' },
        ]}
      />
    </Card>
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

/** CustomStyled — classNames slots (root/title/item/label/content) + style passthrough (slots wave 3). */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="w-[520px]">
      <Descriptions
        title="Task details"
        items={[
          { label: 'Assignee', children: 'Alice' },
          { label: 'Status', children: 'Doing' },
          { label: 'Priority', children: 'High' },
        ]}
        bordered
        style={{ padding: 8 }}
        classNames={{
          root: 'rounded-xl border border-line bg-s2 p-4',
          title: 'uppercase tracking-wide text-accent',
          label: 'bg-s2 font-medium',
          content: 'font-semibold',
        }}
      />
    </div>
  ),
};
