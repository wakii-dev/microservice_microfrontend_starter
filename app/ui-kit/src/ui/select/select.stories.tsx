// Select — PARITY: antd Select (trigger 32 + dropdown radius 8 + option selected
// colorPrimaryBg #e6f4ff). States: selected/placeholder/disabled/open.
import { useState } from 'react';
import { ConfigProvider, Select as AntdSelect } from 'antd';
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

function OursSelected() {
  const [value, setValue] = useState('todo');
  return <Select ariaLabel="Parity select — selected" options={OPTIONS} value={value} onChange={setValue} />;
}

function OursPlaceholder() {
  return <Select ariaLabel="Parity select — placeholder" options={OPTIONS} placeholder="Chọn trạng thái…" />;
}

function OursDisabled() {
  return <Select ariaLabel="Parity select — disabled" options={OPTIONS} value="todo" disabled />;
}

export const ParitySelected: Story = {
  args: { ariaLabel: 'S', options: OPTIONS, value: 'todo' },
  render: () => (
    <Parity
      antd={
        <ConfigProvider theme={{ token: {} }}>
          <AntdSelect style={{ width: 160 }} defaultValue="todo" options={OPTIONS} />
        </ConfigProvider>
      }
      ours={<OursSelected />}
    />
  ),
};

export const Placeholder: Story = {
  args: { ariaLabel: 'S', options: OPTIONS },
  render: () => (
    <Parity
      antd={<AntdSelect style={{ width: 160 }} placeholder="Chọn trạng thái…" options={OPTIONS} />}
      ours={<OursPlaceholder />}
    />
  ),
};

export const Disabled: Story = {
  args: { ariaLabel: 'S', options: OPTIONS, value: 'todo', disabled: true },
  render: () => (
    <Parity
      antd={<AntdSelect style={{ width: 160 }} value="todo" options={OPTIONS} disabled />}
      ours={<OursDisabled />}
    />
  ),
};
