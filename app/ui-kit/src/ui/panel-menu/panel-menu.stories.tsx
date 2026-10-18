// PanelMenu stories — accordion + icons / leaf selection demo.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PanelMenu } from './index';
import { Icon } from '../icons/index';

const meta = { title: 'Navigation/PanelMenu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — accordion + icons',
  render: () => (
    <PanelMenu
      className="w-64"
      items={[
        {
          key: 'manage',
          label: 'Manage',
          icon: <Icon name="menu-bars" size={14} />,
          children: [
            { key: 'tasks', label: 'Tasks' },
            { key: 'users', label: 'Members' },
          ],
        },
        {
          key: 'reports',
          label: 'Reports',
          icon: <Icon name="calendar" size={14} />,
          children: [{ key: 'weekly', label: 'Weekly' }],
        },
      ]}
    />
  ),
};

function SelectionDemoInner() {
  const [selected, setSelected] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-3">
        <span className="text-meta text-ink2">Viewing: {selected ?? '—'}</span>
        <PanelMenu
          className="w-64"
          items={[
            {
              key: 'home',
              label: 'Home',
              icon: <Icon name="home" size={14} />,
              onClick: () => setSelected('Home'),
            },
            {
              key: 'settings',
              label: 'Settings',
              icon: <Icon name="settings" size={14} />,
              children: [
                { key: 'profile', label: 'Profile' },
                { key: 'security', label: 'Security' },
              ],
            },
          ]}
        />
      </div>
    );
}

export const SelectionDemo: Story = {
  name: 'Demo — leaf select + root onClick',
  render: () => <SelectionDemoInner />,
};
