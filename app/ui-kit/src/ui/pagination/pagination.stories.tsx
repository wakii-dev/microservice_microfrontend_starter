// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Pagination (item 32, current accent, ellipsis jump).
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

function OursDemo() {
  const [page, setPage] = useState(5);
  return <Pagination current={page} pageSize={10} total={100} onChange={setPage} />;
}

