// TabMenu stories — controlled activeKey + link variant.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabMenu } from './index';

const meta = { title: 'Navigation/TabMenu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function ControlledDemo() {
  const [tab, setTab] = useState('all');
  return (
    <div className="w-[480px]">
      <TabMenu
        model={[
          { key: 'all', label: 'All' },
          { key: 'doing', label: 'In progress' },
          { key: 'done', label: 'Done' },
        ]}
        activeKey={tab}
        onTabChange={setTab}
      />
      <div className="p-4 text-body text-ink2">
        {tab === 'all' && 'All tasks.'}
        {tab === 'doing' && 'Tasks in progress.'}
        {tab === 'done' && 'Completed tasks.'}
      </div>
    </div>
  );
}

export const Controlled: Story = {
  name: 'Controlled — activeKey + panel swap',
  render: () => <ControlledDemo />,
};

export const Links: Story = {
  name: 'Links — href items (active by key)',
  render: () => (
    <TabMenu
      model={[
        { key: 'docs', label: 'Docs', href: '#' },
        { key: 'api', label: 'API', href: '#' },
      ]}
      activeKey="api"
    />
  ),
};
