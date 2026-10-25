// Parity matrix antd→tokens: docs/parity-matrix.md
// Tag stories — Plain / Checkable (controlled) / Closable (controlled remove) /
// WithIcon / DarkTheme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './index';

/** Tiny label chip — statuses, metadata; Checkable for filter chips. */
const meta = {
  title: 'Data Display/Tag',
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

/* ── Customize pass (SÓNG-3) — classNames slots + style passthrough ── */

/** CustomStyled — classNames slots (root) + style passthrough (SÓNG-3 pattern)
 * for both Tag and Tag.Checkable. Tag is a single primary element, so each
 * exposes only the `root` slot (same element as `className`); `style` lands on
 * that element too; the user's className always comes last. */
// Không annotate StoryObj<typeof Tag> — render trả JSX dùng Tag.Checkable
// (props khác Tag) nên annotation gây false positive TS2322.
export const CustomStyled = {
  name: 'CustomStyled (classNames + style)',
  args: { children: 'label' },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Tag
        icon={<span>●</span>}
        closable
        classNames={{ root: 'border-st-done text-st-done border-dashed' }}
        style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
      >
        deployed
      </Tag>
      <Tag.Checkable
        checked
        classNames={{ root: 'rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)]' }}
        style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
      >
        Checked chip
      </Tag.Checkable>
      <Tag.Checkable
        checked={false}
        classNames={{ root: 'border-dashed rounded-lg' }}
        style={{ borderStyle: 'dashed', color: 'var(--accent)' }}
      >
        Dashed chip
      </Tag.Checkable>
    </div>
  ),
};
