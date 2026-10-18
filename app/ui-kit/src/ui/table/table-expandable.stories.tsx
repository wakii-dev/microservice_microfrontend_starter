// Table expandable stories — antd `expandable` API (docs/parity-matrix.md Gap P0).
// Separate file from table.stories.tsx (unique Storybook title): Basic ·
// DefaultExpanded · RowExpandable=false · combined with selection + pagination.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from './index';

interface Row { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: number }

const DATA: Row[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: `Task ${i + 1}`,
  status: (['todo', 'doing', 'done'] as const)[i % 3],
  priority: (i % 4) + 1,
}));

const COLS = [
  { key: 'title', title: 'Title', sortable: true },
  { key: 'status', title: 'Status' },
  { key: 'priority', title: 'Priority', dataType: 'number' as const, align: 'right' as const },
];

const detail = (r: Row) => (
  <div className="text-label text-ink2">
    <p className="font-medium text-ink">Details for {r.title}</p>
    <p className="mt-1">Status: {r.status} · Priority: P{r.priority} · Assignee: alice@demo.local</p>
  </div>
);

const meta = {
  // Bare meta (title + tags) như table.stories.tsx — Table generic, stories
  // render-driven; khai báo `component` ở đây buộc args required cho từng story.
  title: 'Data Display/Table Expandable',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

/** Basic — expander column is auto-injected; chevron-down rotates 90° when open. */
export const Basic: Story = {
  render: () => (
    <Table
      columns={COLS}
      dataSource={DATA.slice(0, 5)}
      rowKey="id"
      expandable={{ expandedRowRender: detail }}
    />
  ),
};

/** DefaultExpandedRowKeys — rows start open (uncontrolled initial state). */
export const DefaultExpanded: Story = {
  render: () => (
    <Table
      columns={COLS}
      dataSource={DATA.slice(0, 5)}
      rowKey="id"
      expandable={{ expandedRowRender: detail, defaultExpandedRowKeys: ['1', '3'] }}
    />
  ),
};

/** RowExpandable=false — the guarded row shows no chevron at all. */
export const RowExpandableFalse: Story = {
  render: () => (
    <Table
      columns={COLS}
      dataSource={DATA.slice(0, 5)}
      rowKey="id"
      expandable={{
        expandedRowRender: detail,
        rowExpandable: (r) => r.status !== 'done',
      }}
    />
  ),
};

/** Composed — expandable rows keep working with checkbox selection + pagination. */
export const WithSelectionAndPagination: Story = {
  render: () => (
    <Table
      columns={COLS}
      dataSource={DATA}
      rowKey="id"
      paginator
      pageSize={4}
      selectionMode="checkbox"
      expandable={{ expandedRowRender: detail }}
    />
  ),
};
