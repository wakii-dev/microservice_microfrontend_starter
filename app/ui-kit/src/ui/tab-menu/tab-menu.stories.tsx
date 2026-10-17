// TabMenu stories — controlled activeKey + onTabChange; link variant.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabMenu } from './index';

const meta = { title: 'Navigation/TabMenu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  name: 'Controlled — activeKey + đổi panel',
  render: () => {
    const [tab, setTab] = useState('all');
    return (
      <div className="w-[480px]">
        <TabMenu
          model={[
            { key: 'all', label: 'Tất cả' },
            { key: 'doing', label: 'Đang làm' },
            { key: 'done', label: 'Hoàn thành' },
          ]}
          activeKey={tab}
          onTabChange={setTab}
        />
        <div className="p-4 text-body text-ink2">
          {tab === 'all' && 'Danh sách toàn bộ task.'}
          {tab === 'doing' && 'Các task đang làm.'}
          {tab === 'done' && 'Task đã hoàn thành.'}
        </div>
      </div>
    );
  },
};

export const Links: Story = {
  name: 'Links — item có href (active theo key)',
  render: () => (
    <TabMenu
      model={[
        { key: 'docs', label: 'Tài liệu', href: '#' },
        { key: 'api', label: 'API', href: '#' },
      ]}
      activeKey="api"
    />
  ),
};
