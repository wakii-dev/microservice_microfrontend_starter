// SplitButton stories — batch ⑱: Basic / WithIcons+separator / DangerItem / demo.
// Unity shell 2026-10-18: adds UnityTones (4 tones side by side) + Sizes — eyeball
// the "single solid block" (one wrapper border, inner divider, no seam).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitButton } from './index';
import { Icon } from '../icons/index';

// No component set (label/items required → stories are args-driven) — render-only
// stories, same pattern as pagination/carousel.
const meta = { title: 'Navigation/SplitButton', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — primary action + dropdown',
  render: () => (
    <SplitButton
      label="Save task"
      items={[
        { key: 'save-run', label: 'Save + run' },
        { key: 'save-draft', label: 'Save draft' },
      ]}
      onClick={() => {}}
      onItemClick={() => {}}
    />
  ),
};

export const WithIcons: Story = {
  name: 'WithIcons — per-item icons + separator',
  render: () => (
    <SplitButton
      label="Export report"
      items={[
        { key: 'pdf', label: 'Export PDF', icon: <Icon name="download" size={14} /> },
        { key: 'csv', label: 'Export CSV', icon: <Icon name="download" size={14} /> },
        { key: 'sep', label: '', separator: true },
        { key: 'print', label: 'Print', icon: <Icon name="copy" size={14} /> },
      ]}
      onItemClick={() => {}}
    />
  ),
};

/** UnityTones — 4 tones side by side to eyeball the continuous block: primary
 * (border-accent + white divider), default (border-line + line divider), text
 * ghost, danger solid (border-st-fail). Open each menu — hover overlay keeps the
 * block unbroken. */
export const UnityTones: Story = {
  name: 'Unity — 4 solid tones (primary/default/text/danger)',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <SplitButton
        label="Save task"
        items={[
          { key: 'save-run', label: 'Save + run' },
          { key: 'save-draft', label: 'Save draft' },
        ]}
      />
      <SplitButton
        type="default"
        label="Save task"
        items={[
          { key: 'save-run', label: 'Save + run' },
          { key: 'save-draft', label: 'Save draft' },
        ]}
      />
      <SplitButton
        type="text"
        label="Save task"
        items={[
          { key: 'save-run', label: 'Save + run' },
          { key: 'save-draft', label: 'Save draft' },
        ]}
      />
      <SplitButton
        danger
        label="Delete data"
        items={[
          { key: 'soft', label: 'Soft delete (archive)' },
          { key: 'sep', label: '', separator: true },
          { key: 'hard', label: 'Delete permanently', danger: true },
        ]}
      />
    </div>
  ),
};

/** Sizes — small h-8 / middle h-9 (default) / large h-10, synced with Button. */
export const Sizes: Story = {
  name: 'Sizes (h-8 / h-9 / h-10)',
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['small', 'middle', 'large'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 48, fontSize: 12, opacity: 0.6 }}>{s}</span>
          <SplitButton size={s} label="Save task" items={[{ key: 'save-draft', label: 'Save draft' }]} />
          <SplitButton
            size={s}
            type="default"
            label="Export"
            items={[{ key: 'csv', label: 'Export CSV', icon: <Icon name="download" size={14} /> }]}
          />
        </div>
      ))}
    </div>
  ),
};

/** Demo — shows the picked keys (useState). */
export const Demo: Story = {
  name: 'Demo — selected key display (useState)',
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    const push = (msg: string) => setSelected((prev) => [...prev.slice(-2), msg]);
    return (
      <div className="flex flex-col gap-3">
        <ul className="m-0 list-none p-0 text-meta text-ink2">
          {selected.length === 0 ? <li>No action yet.</li> : selected.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
        <SplitButton
          label="Save task"
          items={[
            { key: 'save-run', label: 'Save + run', icon: <Icon name="check-circle" size={14} /> },
            { key: 'sep', label: '', separator: true },
            { key: 'save-draft', label: 'Save draft', icon: <Icon name="pencil" size={14} /> },
          ]}
          onClick={() => push('click: Save task')}
          onItemClick={(key) => push(`item: ${key}`)}
        />
      </div>
    );
  },
};
