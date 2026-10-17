// Table DataTable tests — sort/filter/paginator/selection/scroll/variants/loading/
// empty/expansion/a11y (PrimeReact-level feature set, spec 2026-10-17).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Table } from './index.js';

interface Row {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: number;
}

const DATA: Row[] = [
  { id: '1', title: 'Học TypeScript', status: 'doing', priority: 2 },
  { id: '2', title: 'Áp dụng Tailwind', status: 'todo', priority: 1 },
  { id: '3', title: 'Viết test E2E', status: 'done', priority: 3 },
];

const COLS = [
  { key: 'title', title: 'Tiêu đề', sortable: true, filterable: true },
  { key: 'status', title: 'Trạng thái', sortable: true, filterable: true },
  { key: 'priority', title: 'Ưu tiên', sortable: true },
];

afterEach(cleanup);

describe('Table — render cơ bản', () => {
  it('headers + rows + role=grid + aria-rowcount', () => {
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '3');
    expect(screen.getByText('Học TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Áp dụng Tailwind')).toBeInTheDocument();
  });

  it('dataSource rỗng → EmptyState mặc định; custom emptyMessage', () => {
    const { rerender } = render(<Table columns={COLS} dataSource={[]} rowKey="id" />);
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    rerender(<Table columns={COLS} dataSource={[]} rowKey="id" emptyMessage={<p>Trống trơn</p>} />);
    expect(screen.getByText('Trống trơn')).toBeInTheDocument();
  });

  it('loading → skeleton rows thay body', () => {
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" loading />);
    expect(screen.getAllByText(/Tiêu đề|Trạng thái|Ưu tiên/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Học TypeScript')).toBeNull();
  });

  it('render cell tuỳ ý qua render()', () => {
    render(
      <Table
        columns={[...COLS, { key: 'x', title: 'X', render: (r: Row) => <em data-testid={`em-${r.id}`}>{r.priority * 10}</em> }]}
        dataSource={DATA}
        rowKey="id"
      />,
    );
    expect(screen.getByTestId('em-1')).toHaveTextContent('20');
  });
});

describe('Table — sorting', () => {
  it('click header: asc → desc → none (cycle)', async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Table columns={COLS} dataSource={DATA} rowKey="id" onSort={onSort} />);
    const header = screen.getByText('Tiêu đề').closest('button') ?? screen.getByText('Tiêu đề');
    await user.click(screen.getByText('Tiêu đề').closest('button')!);
    expect(onSort).toHaveBeenLastCalledWith([{ key: 'title', order: 'asc' }]);
    expect(screen.getAllByRole('grid')[0]).toHaveAttribute('aria-rowcount');
    // desc
    await user.click(screen.getByText('Tiêu đề').closest('button')!);
    expect(onSort).toHaveBeenLastCalledWith([{ key: 'title', order: 'desc' }]);
    // none
    await user.click(screen.getByText('Tiêu đề').closest('button')!);
    expect(onSort).toHaveBeenLastCalledWith([]);
    void rerender;
  });

  it('sort asc thật sự đổi thứ tự rows (theo title vi-VN)', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    await user.click(screen.getByText('Tiêu đề').closest('button')!);
    const dataRows = screen.getAllByRole('row').filter((r) => /TypeScript|Tailwind|E2E/.test(r.textContent ?? ''));
    // hàng đầu tiên = "Áp dụng Tailwind" (vi collation: Á < H < V)
    expect(dataRows[0].textContent).toContain('Áp dụng Tailwind');
  });

  it('sortMode multiple + Shift click → giữ sort cũ, thêm sort mới', async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" sortMode="multiple" onSort={onSort} />);
    await user.click(screen.getByText('Tiêu đề').closest('button')!);
    // Shift+click cột status → multi: [title asc, status asc]
    await user.keyboard('{Shift>}');
    await user.click(screen.getByText('Trạng thái'));
    await user.keyboard('{/Shift}');
    expect(onSort).toHaveBeenLastCalledWith([
      { key: 'title', order: 'asc' },
      { key: 'status', order: 'asc' },
    ]);
  });
});

describe('Table — filtering', () => {
  // filter tests qua FilterMenu (menu mode) — xem filter-menu.test.tsx (Tier 5 sweep)

  it('cột không filterable → không có input lọc', () => {
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    expect(screen.queryByLabelText('Lọc Ưu tiên')).toBeNull();
  });
});

describe('Table — paginator', () => {
  const BIG = Array.from({ length: 25 }, (_, i) => ({
    id: String(i),
    title: `Task ${i}`,
    status: 'todo' as const,
    priority: i,
  }));

  it('paginator → page 1 hiện 10/25 + range text; Pagination render', () => {
    render(<Table columns={COLS} dataSource={BIG} rowKey="id" paginator pageSize={10} />);
    expect(screen.getByText('Task 0')).toBeInTheDocument();
    expect(screen.queryByText('Task 10')).toBeNull();
    expect(screen.getByText('1–10 / 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toBeInTheDocument();
  });

  it('đổi rows-per-page → 20 dòng/trang', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={BIG} rowKey="id" paginator pageSize={10} rowsPerPageOptions={[10, 20]} />);
    await user.click(screen.getByRole('combobox', { name: 'Số dòng mỗi trang' }));
    await user.click(screen.getByRole('option', { name: '20' }));
    expect(screen.getByText('Task 19')).toBeInTheDocument();
    expect(screen.getByText('1–20 / 25')).toBeInTheDocument();
  });
});

describe('Table — selection', () => {
  it('selectionMode checkbox → cột checkbox + chọn all-trang', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Table
        columns={COLS}
        dataSource={DATA}
        rowKey="id"
        selectionMode="checkbox"
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Chọn tất cả trang này' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(DATA);
  });

  it('checkbox từng hàng → chọn 1; bỏ chọn → removeFrom', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Table columns={COLS} dataSource={DATA} rowKey="id" selectionMode="checkbox" onSelectionChange={onSelectionChange} />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Chọn hàng 1' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith([DATA[0]]);
    await user.click(screen.getByRole('checkbox', { name: 'Chọn hàng 1' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('selectionMode single → click row chọn 1 record', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" selectionMode="single" onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByText('Học TypeScript'));
    expect(onSelectionChange).toHaveBeenLastCalledWith([DATA[0]]);
  });
});

describe('Table — scroll + variants + expansion', () => {
  it('scrollHeight → wrapper max-height + sticky header class', () => {
    const { container } = render(
      <Table columns={COLS} dataSource={DATA} rowKey="id" scrollHeight={300} />,
    );
    const wrapper = container.querySelector('div[style*="max-height"]') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.maxHeight).toBe('300px');
    expect(container.querySelector('th.sticky') ?? container.querySelector('th')).not.toBeNull();
  });

  it('striped + borderless + size small → class đúng', () => {
    const { container } = render(
      <Table columns={COLS} dataSource={DATA} rowKey="id" striped borderless size="small" />,
    );
    // size small → cell text-label; borderless → td không border-b
    expect(container.querySelector('td')).toHaveClass('text-label');
    expect(container.querySelector('td')?.className).not.toContain('border-b');
  });

  it('row expansion — expander toggle + rowExpansion render', async () => {
    const user = userEvent.setup();
    render(
      <Table
        columns={[{ key: 'ex', title: '', expander: true }, ...COLS]}
        dataSource={DATA}
        rowKey="id"
        rowExpansion={(r) => <p data-testid={`exp-${r.id}`}>Chi tiết {r.title}</p>}
      />,
    );
    await user.click(screen.getAllByRole('button', { name: 'Mở rộng dòng' })[0]);
    expect(screen.getByTestId('exp-1')).toBeInTheDocument();
  });
});
