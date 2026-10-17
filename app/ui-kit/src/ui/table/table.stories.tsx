// Parity matrix antd→tokens: docs/parity-matrix.md
// Table stories — columns/dataSource/render.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/index';
import { Table } from './index';

const meta = { title: 'Data Display/Table', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

interface Row { id: string; title: string; status: 'todo' | 'doing' | 'done' }
const DATA: Row[] = [
  { id: '1', title: 'Task A', status: 'todo' },
  { id: '2', title: 'Task B', status: 'doing' },
  { id: '3', title: 'Task C', status: 'done' },
];
import type { ReactNode } from 'react';

const COLUMNS: Array<{ key: string; title: string; render?: (r: Row) => ReactNode }> = [
  { key: 'title', title: 'Tiêu đề' },
  { key: 'status', title: 'Trạng thái', render: (r: Row) => <Badge variant={r.status}>{r.status}</Badge> },
];

export const CoBan: Story = {
  render: () => <Table columns={COLUMNS} dataSource={DATA} rowKey="id" />,
};
