// Table stories — columns/dataSource/render.
import { Table as AntdTable } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/index';
import { Table } from './index';
import { Parity } from '../../../.storybook/Parity';

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
export const ParityVsAntd: Story = {
  render: () => (
    <Parity
      antd={
        <AntdTable
          pagination={false}
          columns={[
            { title: 'Tiêu đề', dataIndex: 'title' },
            { title: 'Trạng thái', dataIndex: 'status' },
          ]}
          dataSource={DATA}
          rowKey="id"
        />
      }
      ours={<Table columns={COLUMNS} dataSource={DATA} rowKey="id" />}
    />
  ),
};
