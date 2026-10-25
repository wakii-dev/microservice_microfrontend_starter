// ContextMenu stories — right-click menu (items + separator '---' + danger/disabled).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu, type ContextMenuItem } from './index';

/** Right-click menu positioned at the pointer, full keyboard nav. */
const meta = { title: 'Navigation/ContextMenu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items: ContextMenuItem[] = [
  { key: 'open', label: 'Open task' },
  { key: 'rename', label: 'Rename' },
  { key: '---', label: '' },
  { key: 'copy', label: 'Copy link' },
  { key: 'archive', label: 'Archive', disabled: true },
  { key: 'delete', label: 'Delete', danger: true },
];

export const Basic: Story = {
  name: 'Basic — right-click the frame',
  render: () => (
    <ContextMenu items={items} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
      Right-click here to open the menu
    </ContextMenu>
  ),
};

function WithActionsDemo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <span className="text-meta text-ink2">Last action: {last ?? '—'}</span>
      <ContextMenu items={items} onItemClick={setLast} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
        Right-click → pick an item (ESC/outside click closes)
      </ContextMenu>
    </div>
  );
}

export const WithActions: Story = {
  name: 'With actions — onItemClick shows the choice',
  render: () => <WithActionsDemo />,
};

export const WithKeyboardNav: Story = {
  name: 'WithKeyboardNav — ArrowUp/Down cycles, Home/End jumps',
  render: () => (
    <ContextMenu items={items} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
      Right-click to open → ArrowDown/Up moves between items (skips disabled), Home/End first/last
    </ContextMenu>
  ),
};

export const Empty: Story = {
  name: 'Empty — items=[] still opens an empty menu',
  render: () => (
    <ContextMenu items={[]} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
      Right-click → empty menu
    </ContextMenu>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — menu bg-s2 + dark border-line',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <ContextMenu items={items} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
        Right-click inside the dark scope
      </ContextMenu>
    </div>
  ),
};
