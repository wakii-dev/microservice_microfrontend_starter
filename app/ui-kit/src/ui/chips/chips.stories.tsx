// Stories Chips — Forms. Multi-value input với tags, Enter thêm / × xoá.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chips } from './index';

const meta = {
  title: 'Forms/Chips',
  component: Chips,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

function ControlledDemo() {
  const [value, setValue] = useState<string[]>(['react', 'typescript']);
  return (
    <div className="w-96">
      <Chips value={value} onChange={setValue} placeholder="Thêm tech…" />
      <p className="mt-2 text-meta text-ink3">values: {JSON.stringify(value)}</p>
    </div>
  );
}

export const CoBan: Story = {
  name: 'Cơ bản — Enter thêm, × xoá, Backspace xoá cuối',
  render: () => <ControlledDemo />,
};

export const Disabled: Story = {
  name: 'Disabled — chỉ hiển thị',
  args: { value: ['locked-tag'], disabled: true },
};
