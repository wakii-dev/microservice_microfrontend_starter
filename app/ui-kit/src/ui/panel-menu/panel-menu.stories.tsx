// PanelMenu stories — vertical accordion menu (icon + children + leaf onClick).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PanelMenu } from './index';
import { Icon } from '../icons/index';

const meta = { title: 'Navigation/PanelMenu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  name: 'Cơ bản — accordion + icon',
  render: () => (
    <PanelMenu
      className="w-64"
      items={[
        {
          key: 'ql',
          label: 'Quản lý',
          icon: <Icon name="menu-bars" size={14} />,
          children: [
            { key: 'tasks', label: 'Công việc' },
            { key: 'users', label: 'Thành viên' },
          ],
        },
        {
          key: 'bc',
          label: 'Báo cáo',
          icon: <Icon name="calendar" size={14} />,
          children: [{ key: 'weekly', label: 'Hàng tuần' }],
        },
      ]}
    />
  ),
};

export const DemoChon: Story = {
  name: 'Demo — chọn leaf + item gốc onClick',
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-3">
        <span className="text-meta text-ink2">Đang xem: {selected ?? '—'}</span>
        <PanelMenu
          className="w-64"
          items={[
            {
              key: 'home',
              label: 'Trang chủ',
              icon: <Icon name="home" size={14} />,
              onClick: () => setSelected('Trang chủ'),
            },
            {
              key: 'settings',
              label: 'Cài đặt',
              icon: <Icon name="settings" size={14} />,
              children: [
                { key: 'profile', label: 'Hồ sơ' },
                { key: 'security', label: 'Bảo mật' },
              ],
            },
          ]}
        />
      </div>
    );
  },
};
