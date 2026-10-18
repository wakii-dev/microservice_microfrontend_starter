// Table DataTable stories — full PrimeReact-level feature demos.
// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/index';
import { Button } from '../button/index';
import { Table } from './index';

interface Row { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: number }

const DATA: Row[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  title: `Task ${i + 1}`,
  status: (['todo', 'doing', 'done'] as const)[i % 3],
  priority: (i % 5) + 1,
}));

const COLS = [
  { key: 'title', title: 'Title', sortable: true, filterable: true, filterMatchMode: 'contains' as const },
  { key: 'status', title: 'Status', sortable: true, filterable: true, filterMatchMode: 'equals' as const,
    render: (r: Row) => <Badge variant={r.status === 'todo' ? 'todo' : r.status === 'doing' ? 'doing' : 'done'}>{r.status}</Badge> },
  { key: 'priority', title: 'Priority', sortable: true, filterable: true, dataType: 'number' as const, filterMatchMode: 'gte' as const, align: 'right' as const },
];

const meta = { title: 'Data Display/Table (DataTable)', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

// ── Filter Menu (funnel icon + constraint AND/OR + Apply/Reset + badge) ──
export const FilterMenu: Story = {
  name: '1 · Filter Menu (AND/OR + badge)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" filterPlacement="menu" />,
};

// ── Global Filter ──
export const GlobalFilter: Story = {
  name: '2 · Global Filter (search across all columns)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" globalFilter globalFilterPlaceholder="Search all columns…" />,
};

// ── Filter Row (row mode — inputs in header) ──
export const FilterRow: Story = {
  name: '3 · Filter Row (inputs in header)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" filterPlacement="row" />,
};

// ── Sorting (single + multi Shift) ──
function SortDemo() {
  return (
    <Table columns={COLS} dataSource={DATA} rowKey="id" sortMode="multiple" />
  );
}
export const Sorting: Story = {
  name: '4 · Sorting (single + multi Shift)',
  render: () => <SortDemo />,
};

// ── Paginator + rows-per-page ──
export const Paginator: Story = {
  name: '5 · Paginator + Rows-per-page',
  render: () => (
    <Table columns={COLS} dataSource={DATA} rowKey="id" paginator pageSize={10} rowsPerPageOptions={[5, 10, 20]} />
  ),
};

// ── Selection Checkbox + select-all ──
function SelectionDemo() {
  const [selected, setSelected] = useState<Row[]>([]);
  return (
    <div>
      <Table columns={COLS} dataSource={DATA} rowKey="id" selectionMode="checkbox" onSelectionChange={setSelected} paginator pageSize={10} />
      <p className="mt-2 text-label text-ink3">Selected: {selected.length}</p>
    </div>
  );
}
export const Selection: Story = {
  name: '6 · Selection Checkbox + Select-all',
  render: () => <SelectionDemo />,
};

// ── Sticky Header + Scroll ──
function StickyDemo() {
  return <Table columns={COLS} dataSource={DATA} rowKey="id" scrollHeight={300} />;
}
export const StickyHeader: Story = {
  name: '7 · Sticky Header + Scroll',
  render: () => <StickyDemo />,
};

// ── Column Resize ──
export const ColumnResize: Story = {
  name: '8 · Column Resize (drag the edge)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" resizable />,
};

// ── CSV Export ──
function CsvDemo() {
  return <Table columns={COLS} dataSource={DATA} rowKey="id" csvExport csvFilename="tasks" />;
}
export const CsvExport: Story = {
  name: '9 · CSV Export',
  render: () => <CsvDemo />,
};

// ── Variants: striped / borderless / size ──
export const Variants: Story = {
  name: '10 · Variants (striped / borderless / size)',
  render: () => (
    <div className="grid gap-6">
      <Table columns={COLS} dataSource={DATA.slice(0, 5)} rowKey="id" striped />
      <Table columns={COLS} dataSource={DATA.slice(0, 5)} rowKey="id" borderless size="small" />
      <Table columns={COLS} dataSource={DATA.slice(0, 5)} rowKey="id" size="large" />
    </div>
  ),
};

// ── Loading Skeleton ──
export const Loading: Story = {
  name: '11 · Loading Skeleton',
  render: () => <Table columns={COLS} dataSource={[]} rowKey="id" loading />,
};

// ── Empty State ──
export const Empty: Story = {
  name: '12 · Empty State',
  render: () => (
    <Table columns={COLS} dataSource={[]} rowKey="id" emptyMessage={<p className="p-6 text-center text-ink3">Custom empty message</p>} />
  ),
};

// ── Row Expansion ──
function ExpandDemo() {
  return (
    <Table
      columns={[{ key: 'ex', title: '', expander: true }, ...COLS]}
      dataSource={DATA.slice(0, 5)}
      rowKey="id"
      rowExpansion={(r) => <p>Details for {r.title} — priority {r.priority}</p>}
    />
  );
}
export const RowExpansion: Story = {
  name: '13 · Row Expansion',
  render: () => <ExpandDemo />,
};

// ── Virtual Scroll (5000 rows — windowed, DOM keeps ~20 rows) ──
interface BigRow { id: string; name: string; team: string; status: 'todo' | 'doing' | 'done'; point: number }

// Handmade faker — deterministic (derived from index, no runtime randomness)
const FIRST = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake'];
const MIDDLE = ['J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V'];
const LAST = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];
const TEAMS = ['Frontend', 'Backend', 'QA', 'DevOps', 'Data'];

const BIG_DATA: BigRow[] = Array.from({ length: 5000 }, (_, i) => ({
  id: String(i + 1),
  name: `${FIRST[i % 10]} ${MIDDLE[(i * 3) % 10]}. ${LAST[(i * 7) % 10]}`,
  team: TEAMS[i % 5],
  status: (['todo', 'doing', 'done'] as const)[i % 3],
  point: 20 + ((i * 13) % 81),
}));

const BIG_COLS = [
  { key: 'id', title: 'ID', width: '64px', sortable: true },
  { key: 'name', title: 'Member', sortable: true },
  { key: 'team', title: 'Team', sortable: true, filterable: true, filterMatchMode: 'equals' as const },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (r: BigRow) => (
      <Badge variant={r.status === 'todo' ? 'todo' : r.status === 'doing' ? 'doing' : 'done'}>{r.status}</Badge>
    ),
  },
  { key: 'point', title: 'Points', sortable: true, dataType: 'number' as const, align: 'right' as const },
];

export const VirtualScroll: Story = {
  name: '14 · Virtual Scroll (5000 rows)',
  render: () => (
    <div>
      <p className="mb-2 text-label text-ink3">
        5000 rows · itemHeight 44 · scrollHeight 480 — try scrolling: smooth, DOM keeps ~20 rows around the viewport
      </p>
      <Table
        columns={BIG_COLS}
        dataSource={BIG_DATA}
        rowKey="id"
        virtual={{ itemHeight: 44 }}
        scrollHeight={480}
      />
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme — striped/selected follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-s2 p-4">
      <Table columns={COLS} dataSource={DATA.slice(0, 5)} rowKey="id" striped />
    </div>
  ),
};

function ZebraDemo() {
  return (
    <Table
      columns={[
        ...COLS.slice(0, 2),
        {
          key: 'actions',
          title: 'Actions',
          align: 'right' as const,
          // Actions column padding convention: standard Button (h-8, px tokens) —
          // no ad-hoc link spacing inside cells.
          render: () => (
            <span className="inline-flex items-center gap-1">
              <Button size="small">Edit</Button>
              <Button size="small" type="text" danger>Delete</Button>
            </span>
          ),
        },
      ]}
      dataSource={DATA.slice(0, 5)}
      rowKey="id"
      striped
    />
  );
}

export const Zebra: Story = {
  name: 'Zebra — striped rows bg-s3/40 + normalized Actions column',
  render: () => <ZebraDemo />,
};

export const CustomStyled: Story = {
  name: 'CustomStyled — classNames slots merge after defaults',
  render: () => (
    <Table
      columns={COLS}
      dataSource={DATA.slice(0, 5)}
      rowKey="id"
      striped
      classNames={{
        wrapper: 'border-2 border-dashed border-accent/40',
        header: 'bg-accent/10',
        row: 'hover:bg-accent/5',
        cell: 'italic',
      }}
    />
  ),
};
