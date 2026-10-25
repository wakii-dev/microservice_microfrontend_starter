// SlideMenu stories — click an item with a chevron to slide into its level;
// the back bar (or ESC) slides out. No deps: transform + motion tokens only.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index.js';
import { SlideMenu, type SlideMenuItem } from './index';

const meta = { title: 'Navigation/SlideMenu', component: SlideMenu, tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

const PROJECTS: SlideMenuItem[] = [
  {
    key: 'projects',
    label: 'Projects',
    children: [
      {
        key: 'active',
        label: 'Active',
        children: [
          { key: 'vu53', label: 'VU-53 UI redesign' },
          { key: 'fi62', label: 'FI-62 boilerplate' },
        ],
      },
      { key: 'archived', label: 'Archived', children: [{ key: 'spike', label: 'MF spike pins' }] },
    ],
  },
  { key: 'settings', label: 'Settings' },
];

/** Basic — two levels: click "Projects" to slide in, the back bar slides out (ESC works too). */
export const Basic: Story = {
  render: () => <SlideMenu items={PROJECTS} ariaLabel="Projects menu" className="w-64" />,
};

/** MultiLevel — three levels deep; each back bar shows the label of its parent level. */
export const MultiLevel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-meta text-ink3">Projects → Active/Archived → concrete items. Watch the track translateX (-100% per level).</p>
      <SlideMenu items={PROJECTS} ariaLabel="Deep menu" className="w-64" />
    </div>
  ),
};

/** WithIcons — icons per item, danger leaf in red, and a leaf action counter. */
export const WithIcons: Story = {
  render: () => <IconsDemo />,
};

function IconsDemo() {
  const [last, setLast] = useState('—');
  return (
    <div className="flex flex-col gap-2">
      <SlideMenu
        ariaLabel="Account menu"
        className="w-64"
        items={[
          {
            key: 'account',
            label: 'Account',
            icon: <Icon name="user" size={14} className="text-accent" />,
            children: [
              { key: 'profile', label: 'Profile', icon: <Icon name="eye" size={14} className="text-ink3" /> },
              { key: 'security', label: 'Security', icon: <Icon name="settings" size={14} className="text-ink3" /> },
              { key: 'logout', label: 'Log out', danger: true },
            ],
          },
          {
            key: 'billing',
            label: 'Billing',
            icon: <Icon name="file" size={14} className="text-ink3" />,
            children: [{ key: 'invoices', label: 'Invoices', onClick: () => setLast('invoices') }],
          },
        ]}
      />
      <p className="m-0 text-meta text-ink3">
        Last leaf action: <strong className="text-ink">{last}</strong>
      </p>
    </div>
  );
}

/** DarkTheme — rail + back bar trên dark canvas (tokens cascade). */
export const DarkTheme: Story = {
  name: 'Dark theme — nav on dark canvas',
  render: () => (
    <div data-bp-theme="dark" className="w-fit rounded-xl bg-canvas p-4">
      <SlideMenu items={PROJECTS} ariaLabel="Projects menu" className="w-64" />
    </div>
  ),
};
