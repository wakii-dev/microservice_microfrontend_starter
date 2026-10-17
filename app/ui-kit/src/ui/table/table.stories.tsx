// Table DataTable stories — demo đầy đủ features PrimeReact-level.
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
  { key: 'title', title: 'Tiêu đề', sortable: true, filterable: true, filterMatchMode: 'contains' as const },
  { key: 'status', title: 'Trạng thái', sortable: true, filterable: true, filterMatchMode: 'equals' as const,
    render: (r: Row) => <Badge variant={r.status === 'todo' ? 'todo' : r.status === 'doing' ? 'doing' : 'done'}>{r.status}</Badge> },
  { key: 'priority', title: 'Ưu tiên', sortable: true, filterable: true, dataType: 'number' as const, filterMatchMode: 'gte' as const },
];

const meta = { title: 'Data Display/Table (DataTable)', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

// ── Filter Menu (funnel icon + constraint AND/OR + Apply/Reset + badge) ──
export const FilterMenuDemo: Story = {
  name: '1 · Filter Menu (AND/OR + badge)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" filterPlacement="menu" />,
};

// ── Global Filter ──
export const TimKiemToanCuc: Story = {
  name: '2 · Global Filter (search qua mọi cột)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" globalFilter globalFilterPlaceholder="Tìm mọi cột…" />,
};

// ── Filter Row (mode row — input trên header) ──
export const FilterRow: Story = {
  name: '3 · Filter Row (input trên header)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" filterPlacement="row" />,
};

// ── Sorting (single + multi Shift) ──
function SortDemo() {
  return (
    <Table columns={COLS} dataSource={DATA} rowKey="id" sortMode="multiple" />
  );
}
export const SapXep: Story = {
  name: '4 · Sorting (single + multi Shift)',
  render: () => <SortDemo />,
};

// ── Paginator + rows-per-page ──
export const PhanTrang: Story = {
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
      <p className="mt-2 text-label text-ink3">Đã chọn: {selected.length}</p>
    </div>
  );
}
export const ChonHang: Story = {
  name: '6 · Selection Checkbox + Select-all',
  render: () => <SelectionDemo />,
};

// ── Frozen Columns (sticky) ──
function FrozenDemo() {
  return <Table columns={COLS} dataSource={DATA} rowKey="id" scrollHeight={300} />;
}
export const CotFrozen: Story = {
  name: '7 · Sticky Header + Scroll',
  render: () => <FrozenDemo />,
};

// ── Column Resize ──
export const ResizeCot: Story = {
  name: '8 · Column Resize (kéo viền cột)',
  render: () => <Table columns={COLS} dataSource={DATA} rowKey="id" resizable />,
};

// ── CSV Export ──
function CsvDemo() {
  return <Table columns={COLS} dataSource={DATA} rowKey="id" csvExport csvFilename="tasks" />;
}
export const XuatCSV: Story = {
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
export const DangTai: Story = {
  name: '11 · Loading Skeleton',
  render: () => <Table columns={COLS} dataSource={[]} rowKey="id" loading />,
};

// ── Empty State ──
export const Rong: Story = {
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
      rowExpansion={(r) => <p>Chi tiết {r.title} — priority {r.priority}</p>}
    />
  );
}
export const MoRong: Story = {
  name: '13 · Row Expansion',
  render: () => <ExpandDemo />,
};
