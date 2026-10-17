// Select stories — states: selected/placeholder/disabled.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './index';

const meta = {
  title: 'Primitives/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Cần làm', value: 'todo' },
  { label: 'Đang làm', value: 'in_progress' },
  { label: 'Xong', value: 'done' },
];

function OursSelected() {
  const [value, setValue] = useState('todo');
  return <Select ariaLabel="Parity select — selected" options={OPTIONS} value={value} onChange={setValue} />;
}

export const Selected: Story = {
  args: { ariaLabel: 'S', options: OPTIONS, value: 'todo' },
  render: () => <OursSelected />,
};
export const Placeholder: Story = {
  args: { ariaLabel: 'Parity select — placeholder', options: OPTIONS, placeholder: 'Chọn trạng thái…' },
};
export const Disabled: Story = {
  args: { ariaLabel: 'Parity select — disabled', options: OPTIONS, value: 'todo', disabled: true },
};
