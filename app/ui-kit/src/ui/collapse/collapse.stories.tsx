// Parity matrix antd→tokens: docs/parity-matrix.md
// Collapse stories — accordion 1 panel mở / nhiều panel mở cùng lúc.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapse } from './index';

const meta = { title: 'Data Display/Collapse', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { key: '1', label: 'Panel 1 — Tổng quan', children: 'Nội dung panel 1. Click header để gập/mở (animate grid-rows).' },
  { key: '2', label: 'Panel 2 — Chi tiết kỹ thuật', children: 'Nội dung panel 2. Nhiều panel có thể mở cùng lúc (Set keys).' },
  { key: '3', label: 'Panel 3 — Lịch sử', children: 'Nội dung panel 3. Chevron xoay 180° khi mở.' },
];

export const Accordion: Story = {
  name: 'Accordion — mở sẵn 1 panel',
  render: () => <Collapse items={items} defaultActiveKeys={['1']} className="w-[480px]" />,
};

export const NhieuPanel: Story = {
  name: 'Nhiều panel mở cùng lúc',
  render: () => <Collapse items={items} defaultActiveKeys={['1', '3']} className="w-[480px]" />,
};
