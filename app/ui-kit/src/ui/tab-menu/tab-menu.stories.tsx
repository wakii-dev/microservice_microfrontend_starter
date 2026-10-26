// TabMenu stories — controlled activeKey + link variant.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabMenu } from './index';

/** Tab-style navigation — links or panels by activeKey. */
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

/** CustomStyled — slots-wave classNames + style: `root` lands on the nav bar,
 * `item` on every tab (link or button); `style` lands on the nav. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <TabMenu
      model={[
        { key: 'overview', label: 'Overview' },
        { key: 'activity', label: 'Activity' },
        { key: 'settings', label: 'Settings' },
      ]}
      activeKey="overview"
      classNames={{ root: 'rounded-xl border border-dashed border-accent bg-accent/5 px-2', item: 'uppercase tracking-wide' }}
      style={{ padding: 8 }}
    />
  ),
};
