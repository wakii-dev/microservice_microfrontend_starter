// Menubar stories — hover dropdown + controlled selection demo.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menubar } from './index';

/** Horizontal menubar with hover dropdowns. */
const meta = { title: 'Navigation/Menubar', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — hover dropdown',
  render: () => (
    <Menubar
      items={[
        { key: 'file', label: 'File', children: [{ key: 'new', label: 'New task' }, { key: 'import', label: 'Import CSV' }] },
        { key: 'edit', label: 'Edit', children: [{ key: 'undo', label: 'Undo' }, { key: 'redo', label: 'Redo' }] },
        { key: 'help', label: 'Help' },
      ]}
    />
  ),
};

function DemoMenubar() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <span className="text-meta text-ink2">Selected: {last ?? '—'}</span>
      <Menubar
        items={[
          {
            key: 'task',
            label: 'Task',
            children: [
              { key: 'new', label: 'New task' },
              { key: 'bulk', label: 'Bulk create' },
            ],
            onClick: () => setLast('Task (root menu)'),
          },
          { key: 'about', label: 'About', onClick: () => setLast('About') },
        ]}
      />
    </div>
  );
}

export const SelectionDemo: Story = {
  name: 'Demo — onClick + onItemClick display',
  render: () => <DemoMenubar />,
};

export const DangerItem: Story = {
  name: 'Danger item — destructive submenu action',
  render: () => (
    <Menubar
      items={[
        {
          key: 'task',
          label: 'Task',
          children: [{ key: 'new', label: 'New task' }, { key: 'del', label: 'Delete task…', danger: true }],
        },
        { key: 'help', label: 'Help' },
      ]}
    />
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the nav bar,
 * `item`/`itemButton` on top-level entries, `submenu`/`subItem` on the hover
 * dropdown; `style` lands on the nav. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Menubar
      style={{ padding: 8 }}
      classNames={{
        root: 'rounded-xl border border-dashed border-accent bg-accent/5',
        itemButton: 'uppercase tracking-wide',
        submenu: 'rounded-2xl',
        subItem: 'font-medium',
      }}
      items={[
        { key: 'file', label: 'File', children: [{ key: 'new', label: 'New' }, { key: 'open', label: 'Open' }] },
        { key: 'edit', label: 'Edit' },
      ]}
    />
  ),
};
