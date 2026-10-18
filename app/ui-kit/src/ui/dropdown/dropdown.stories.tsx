import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from 'react';
import { Dropdown, type DropdownItem } from './index';
import { Button } from '../button/index';

/** Button-triggered action menu with role=menu keyboard nav. */
const meta = { title: 'Navigation/Dropdown', component: Dropdown, tags: ['autodocs'] } satisfies Meta<typeof Dropdown>;
export default meta;
type S = StoryObj<typeof meta>;
type R = StoryObj;

const items: DropdownItem[] = [
  { key: 'edit', label: 'Edit' },
  { key: 'duplicate', label: 'Duplicate' },
  { key: '---', label: '' },
  { key: 'archive', label: 'Archive', disabled: true },
  { key: 'delete', label: 'Delete', danger: true },
];

function Demo() {
  const [msg, setMsg] = useState('');
  return (
    <div>
      <Dropdown trigger={<Button>Action ▾</Button>} onItemClick={(k) => setMsg(k)} items={items} />
      {msg && <p className="mt-2 text-label text-ink2">Selected: {msg}</p>}
    </div>
  );
}

export const Basic: S = {
  name: 'Basic — divider + disabled + danger items',
  args: { trigger: <button>Menu</button>, items: [{ key: 'a', label: 'A' }] },
  render: () => <Demo />,
};

export const Minimal: S = {
  name: 'Minimal — single item, min-width menu',
  args: { trigger: <button>Menu</button>, items: [{ key: 'a', label: 'A' }] },
  render: () => (
    <Dropdown trigger={<Button>Only one action ▾</Button>} items={[{ key: 'only', label: 'The only action' }]} />
  ),
};

export const WithKeyboardNav: R = {
  name: 'WithKeyboardNav — ArrowDown opens + focuses first, ESC returns focus',
  render: () => (
    <div className="flex flex-col gap-2">
      <span className="text-label text-ink2">Focus the trigger, press ArrowDown / Enter / Space</span>
      <Dropdown trigger={<Button>Keyboard menu ▾</Button>} items={items} />
    </div>
  ),
};

export const DarkTheme: R = {
  name: 'DarkTheme — menu bg-s2 + shadow-pop dark',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Dropdown trigger={<Button>Action ▾ (dark)</Button>} items={items} />
    </div>
  ),
};
