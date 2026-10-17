// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: PrimeReact Paginator (item 32, current accent fill, ellipsis jump).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './index';

const meta = {
  title: 'Primitives/Pagination',
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
  render: () => <ControlledDemo />,
};

export const TrangDau: Story = {
  name: 'Trang đầu — prev disabled',
  render: () => <ControlledDemo initial={1} total={100} />,
};

export const TrangCuoi: Story = {
  name: 'Trang cuối — next disabled',
  render: () => <ControlledDemo initial={10} total={100} />,
};

export const ItTrang: Story = {
  name: 'Ít trang — không ellipsis',
  render: () => <ControlledDemo initial={2} total={40} />,
};

export const NhieuTrang: Story = {
  name: 'Nhiều trang — ellipsis jump',
  render: () => <ControlledDemo initial={50} total={1000} />,
};
