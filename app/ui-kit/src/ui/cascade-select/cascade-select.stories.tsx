// Stories CascadeSelect — Forms. Chọn phân cấp theo tầng (Cascader lite).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CascadeSelect, type CascadeOption } from './index';

const meta = {
  title: 'Forms/CascadeSelect',
  component: CascadeSelect,
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

const TREE: CascadeOption[] = [
  {
    label: 'Hà Nội',
    value: 'hn',
    children: [
      { label: 'Ba Đình', value: 'hn-bd' },
      { label: 'Tây Hồ', value: 'hn-th' },
      { label: 'Cầu Giấy', value: 'hn-cg' },
    ],
  },
  {
    label: 'TP.HCM',
    value: 'hcm',
    children: [
      { label: 'Quận 1', value: 'hcm-1' },
      { label: 'Quận 3', value: 'hcm-3' },
    ],
  },
  { label: 'Đà Nẵng', value: 'dn' },
];

function ControlledDemo() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <div className="w-72">
      <CascadeSelect options={TREE} value={value} onChange={setValue} placeholder="Chọn địa điểm…" />
      <p className="mt-2 text-meta text-ink3">path: {value.length > 0 ? value.join(' / ') : '—'}</p>
    </div>
  );
}

export const CoBan: Story = {
  name: 'Cơ bản — chọn theo tầng cha → con',
  render: () => <ControlledDemo />,
};
