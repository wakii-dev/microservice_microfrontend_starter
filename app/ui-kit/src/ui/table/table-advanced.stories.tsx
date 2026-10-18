// Table advanced stories — fixed header (scroll.y) · summary row · sorting 3-state.
// Separate file from table.stories.tsx (unique Storybook title), same data style.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from './index';

interface Row { id: string; title: string; status: 'todo' | 'doing' | 'done'; point: number }

const DATA: Row[] = Array.from({ length: 28 }, (_, i) => ({
  id: String(i + 1),
  title: `Task ${i + 1}`,
  status: (['todo', 'doing', 'done'] as const)[i % 3],
  point: ((i * 7) % 13) + 1,
}));

const COLS = [
  { key: 'title', title: 'Title', sortable: true },
  { key: 'status', title: 'Status', sortable: true },
  { key: 'point', title: 'Points', dataType: 'number' as const, align: 'right' as const, sortable: true },
];

const meta = {
  title: 'Data Display/Table Advanced',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj;

/** FixedHeader — scroll={{ y: 280 }}: wrapper max-height, thead sticks while rows scroll under it. */
export const FixedHeader: Story = {
  render: () => (
    <div className="w-[560px]">
      <Table columns={COLS} dataSource={DATA} rowKey="id" scroll={{ y: 280 }} striped />
    </div>
  ),
};

/** SummaryRow — antd-style footer: totals computed from the CURRENT page data; sticks to the bottom under scroll.y. */
export const SummaryRow: Story = {
  render: () => (
    <div className="w-[560px]">
      <Table
        columns={COLS}
        dataSource={DATA}
        rowKey="id"
        paginator
        pageSize={8}
        scroll={{ y: 300 }}
        summary={(page) => {
          const total = page.reduce((s, r) => s + r.point, 0);
          const done = page.filter((r) => r.status === 'done').length;
          return (
            <div className="flex items-center justify-between text-label text-ink2">
              <span>{page.length} tasks on page · {done} done</span>
              <span className="text-ink">Total points: {total}</span>
            </div>
          );
        }}
      />
    </div>
  ),
};

/** SortStates — click a header: asc → desc → none (3-state cycle); aria-sort mirrors the state. */
export const SortStates: Story = {
  render: () => (
    <div className="w-[560px]">
      <p className="mb-2 text-label text-ink3">
        Click “Title” / “Points” — cycle ascending → descending → none (check aria-sort in devtools).
      </p>
      <Table columns={COLS} dataSource={DATA.slice(0, 8)} rowKey="id" />
    </div>
  ),
};

/** AllTogether — fixed header + summary + sorting + expandable on one grid. */
export const AllTogether: Story = {
  render: () => (
    <div className="w-[640px]">
      <Table
        columns={COLS}
        dataSource={DATA}
        rowKey="id"
        scroll={{ y: 320 }}
        striped
        expandable={{ expandedRowRender: (r) => <p className="text-label text-ink2">Details for {r.title} — P{r.point}, {r.status}</p> }}
        summary={(page) => <span className="text-label text-ink2">Σ {page.reduce((s, r) => s + r.point, 0)} points on {page.length} rows</span>}
      />
    </div>
  ),
};
