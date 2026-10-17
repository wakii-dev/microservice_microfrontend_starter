// Menubar stories — horizontal bar, hover dropdown submenu.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menubar } from './index';

const meta = { title: 'Navigation/Menubar', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  name: 'Cơ bản — hover dropdown',
  render: () => (
    <Menubar
      items={[
        { key: 'file', label: 'File', children: [{ key: 'new', label: 'Task mới' }, { key: 'import', label: 'Nhập CSV' }] },
        { key: 'edit', label: 'Edit', children: [{ key: 'undo', label: 'Hoàn tác' }, { key: 'redo', label: 'Làm lại' }] },
        { key: 'help', label: 'Trợ giúp' },
      ]}
    />
  ),
};

export const DemoChon: Story = {
  name: 'Demo — onClick item lá hiển thị',
  render: () => {
    const [last, setLast] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-3">
        <span className="text-meta text-ink2">Đã chọn: {last ?? '—'}</span>
        <Menubar
          items={[
            {
              key: 'task',
              label: 'Task',
              children: [
                { key: 'new', label: 'Task mới' },
                { key: 'bulk', label: 'Tạo hàng loạt' },
              ],
              onClick: () => setLast('Task (menu gốc)'),
            },
            { key: 'about', label: 'Giới thiệu', onClick: () => setLast('Giới thiệu') },
          ]}
        />
      </div>
    );
  },
};
