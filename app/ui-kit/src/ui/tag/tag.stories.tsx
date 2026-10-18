// Parity matrix antd→tokens: docs/parity-matrix.md
// Tag stories — Plain / Checkable (controlled) / Closable (controlled remove) /
// WithIcon / DarkTheme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './index';

const meta = {
  title: 'Primitives/Tag',
  component: Tag,
  tags: ['autodocs'],
} satisfies Meta<typeof Tag>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  name: 'Plain — pill label, line border',
  args: { children: 'created' },
};

function CheckableDemo() {
  const [checked, setChecked] = useState<'all' | 'doing' | null>('all');
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Tag.Checkable checked={checked === 'all'} onChange={() => setChecked('all')}>
        All
      </Tag.Checkable>
      <Tag.Checkable checked={checked === 'doing'} onChange={() => setChecked('doing')}>
        In progress
      </Tag.Checkable>
      <Tag.Checkable checked={checked === null} onChange={() => setChecked(null)}>
        Done
      </Tag.Checkable>
    </div>
  );
}

export const CheckableFilterChips: Story = {
  args: { children: 'All' },
  name: 'Checkable (filter chips — controlled)',
  render: () => <CheckableDemo />,
};

function ClosableDemo() {
  const [tags, setTags] = useState(['frontend', 'backend', 'devops']);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tags.length === 0 && <span className="text-label text-ink3">All removed — consumer decides via onClose</span>}
      {tags.map((t) => (
        <Tag key={t} closable onClose={() => setTags((p) => p.filter((x) => x !== t))}>
          {t}
        </Tag>
      ))}
    </div>
  );
}

export const Closable: Story = {
  args: { children: 'label' },
  name: 'Closable — × removes (consumer decides)',
  render: () => <ClosableDemo />,
};

export const WithIcon: Story = {
  args: { children: 'label' },
  name: 'Icon + label',
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Tag icon={<span aria-hidden="true">◆</span>}>high priority</Tag>
      <Tag.Checkable checked icon={<span aria-hidden="true">✓</span>}>done</Tag.Checkable>
    </div>
  ),
};

export const DarkTheme: Story = {
  args: { children: 'label' },
  name: 'Dark theme — line border + ink2 text follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="flex gap-3 rounded-xl bg-s2 p-4">
      <Tag>created</Tag>
      <Tag closable onClose={() => {}}>in progress</Tag>
      <Tag.Checkable checked>done</Tag.Checkable>
      <Tag.Checkable checked={false}>pending</Tag.Checkable>
    </div>
  ),
};
