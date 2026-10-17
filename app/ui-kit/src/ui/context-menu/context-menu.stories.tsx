// ContextMenu stories — right-click menu (items + separator '---' + danger/disabled).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu, type ContextMenuItem } from './index';

const meta = { title: 'Navigation/ContextMenu', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items: ContextMenuItem[] = [
  { key: 'open', label: 'Mở task' },
  { key: 'rename', label: 'Đổi tên' },
  { key: '---', label: '' },
  { key: 'copy', label: 'Copy link' },
  { key: 'archive', label: 'Lưu trữ', disabled: true },
  { key: 'delete', label: 'Xoá', danger: true },
];

export const CoBan: Story = {
  name: 'Cơ bản — right-click vào khung',
  render: () => (
    <ContextMenu items={items} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
      Right-click vào đây để mở menu
    </ContextMenu>
  ),
};

export const DemoHanhDong: Story = {
  name: 'Demo hành động — onItemClick hiển thị lựa chọn',
  render: () => {
    const [last, setLast] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-3">
        <span className="text-meta text-ink2">Hành động cuối: {last ?? '—'}</span>
        <ContextMenu items={items} onItemClick={setLast} className="grid h-40 place-items-center rounded-xl border border-dashed border-line bg-s3 text-ink3">
          Right-click → chọn 1 item (ESC/click ngoài để đóng)
        </ContextMenu>
      </div>
    );
  },
};
