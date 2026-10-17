import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from './index';

const meta = {
  title: 'Primitives/Tag',
  component: Tag,
  tags: ['autodocs'],
} satisfies Meta<typeof Tag>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  args: { children: 'đã tạo' },
};

function CheckableDemo() {
  const [checked, setChecked] = useState<'all' | 'doing' | null>('all');
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Tag.Checkable checked={checked === 'all'} onChange={() => setChecked('all')}>
        Tất cả
      </Tag.Checkable>
      <Tag.Checkable checked={checked === 'doing'} onChange={() => setChecked('doing')}>
        Đang làm
      </Tag.Checkable>
      <Tag.Checkable checked={checked === null} onChange={() => setChecked(null)}>
        Xong
      </Tag.Checkable>
    </div>
  );
}

export const CheckableFilterChips: Story = {
  name: 'Checkable (filter chips)',
  render: () => <CheckableDemo />,
};
