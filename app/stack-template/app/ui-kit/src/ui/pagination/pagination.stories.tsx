// Parity matrix antd→tokens: docs/parity-matrix.md
// PARITY: antd Pagination (item ô vuông 32 không viền, active accent fill + fontWeightStrong,
// hover colorBgTextHover, SVG chevron, ellipsis ··· jump ±5).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './index';
import { Segmented } from '../segmented/index';

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

// ── Real-world usage (2026-10-25): table footer ──

/** TableFooter — classic table footer: "1–10 của 87" range text, a page-size changer,
 * controlled Pagination. In a real app, wire onChange to your query — not local state. */
export const TableFooter: StoryObj = {
  name: 'Table footer — range text + size changer + controlled page (87 items)',
  render: () => <TableFooterDemo />,
};

function TableFooterDemo() {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const total = 87;
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-line bg-s1 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-meta text-ink3">{`Hiển thị ${from}–${to} của ${total} mục`}</span>
        <span className="flex items-center gap-2 text-meta text-ink3">
          {'Số dòng:'}
          <Segmented
            ariaLabel="Số dòng mỗi trang"
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              setCurrent(1);
            }}
            options={[
              { label: '10', value: '10' },
              { label: '20', value: '20' },
              { label: '50', value: '50' },
            ]}
          />
        </span>
      </div>
      <Pagination current={current} pageSize={pageSize} total={total} onChange={setCurrent} />
    </div>
  );
}
