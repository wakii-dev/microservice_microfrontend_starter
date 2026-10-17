// SplitButton stories — primary action + dropdown secondary (primary/danger).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitButton } from './index';

const meta = { title: 'Navigation/SplitButton', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  name: 'Cơ bản — action chính + dropdown',
  render: () => (
    <SplitButton
      label="Lưu task"
      items={[
        { key: 'save-run', label: 'Lưu + chạy' },
        { key: 'save-draft', label: 'Lưu nháp' },
      ]}
      onClick={() => console.log('save')}
      onItemClick={(key) => console.log('item:', key)}
    />
  ),
};

export const DemoChon: Story = {
  name: 'Demo — onClick + onItemClick hiển thị',
  render: () => {
    const [log, setLog] = useState<string[]>([]);
    const push = (msg: string) => setLog((prev) => [...prev.slice(-2), msg]);
    return (
      <div className="flex flex-col gap-3">
        <ul className="m-0 list-none p-0 text-meta text-ink2">
          {log.length === 0 ? <li>Chưa có hành động nào.</li> : log.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
        <SplitButton
          label="Xoá dữ liệu"
          danger
          items={[
            { key: 'soft', label: 'Xoá mềm (archive)' },
            { key: 'hard', label: 'Xoá vĩnh viễn', danger: true },
          ]}
          onClick={() => push('click: Xoá dữ liệu')}
          onItemClick={(key) => push(`item: ${key}`)}
        />
      </div>
    );
  },
};
