// Select — PARITY: antd Select (single) vs ui-kit. Matrix: PARITY_MATRIX (.storybook/Parity)
// + trigger controlHeight 32 / borderRadius 6 / colorBorder #d9d9d9 / dropdown shadow
// popover / option selected colorPrimaryBg #e6f4ff.
import { useState } from 'react';
import { Select as AntdSelect } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
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

function OursDemo() {
  const [value, setValue] = useState('todo');
  return <Select ariaLabel="Parity select" options={OPTIONS} value={value} onChange={setValue} />;
}

export const ParityVsAntd: Story = {
  render: () => (
    <Parity
      antd={<AntdSelect style={{ width: 160 }} defaultValue="todo" options={OPTIONS} />}
      ours={<OursDemo />}
    />
  ),
};
