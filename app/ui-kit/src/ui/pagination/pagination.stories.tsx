// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Pagination (item ô vuông 32 không viền, active accent fill + fontWeightStrong,
// hover colorBgTextHover, SVG chevron, ellipsis ··· jump ±5).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './index';

/** Page controls — ellipsis jump ±5, prev/next edge states. */
const meta = {
  title: 'Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;
export default meta;

type Story = StoryObj<typeof meta>;

function ControlledDemo({ initial = 5, total = 100 }: { initial?: number; total?: number }) {
  const [page, setPage] = useState(initial);
  return <Pagination current={page} pageSize={10} total={total} onChange={setPage} />;
}

export const CoBan: Story = {
  args: { current: 5, pageSize: 10, total: 100 },
  render: () => <ControlledDemo />,
};

export const TrangDau: Story = {
  name: 'First page — prev disabled',
  args: { current: 1, pageSize: 10, total: 100 },
  render: () => <ControlledDemo initial={1} total={100} />,
};

export const TrangCuoi: Story = {
  name: 'Last page — next disabled',
  args: { current: 10, pageSize: 10, total: 100 },
  render: () => <ControlledDemo initial={10} total={100} />,
};

export const ItTrang: Story = {
  name: 'Few pages — no ellipsis',
  args: { current: 2, pageSize: 10, total: 40 },
  render: () => <ControlledDemo initial={2} total={40} />,
};

export const NhieuTrang: Story = {
  name: 'Many pages — ellipsis jump',
  args: { current: 50, pageSize: 10, total: 1000 },
  render: () => <ControlledDemo initial={50} total={1000} />,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  args: { current: 5, pageSize: 10, total: 100 },
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <ControlledDemo />
    </div>
  ),
};
