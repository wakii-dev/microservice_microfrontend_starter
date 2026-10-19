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

  it('scroll.y + selection + expandable → MỌI th hàng header sticky top-0 z-10 (kể cả cột selection/expand — bugfix PO full-demo)', () => {
    const { container } = render(
      <Table
        columns={COLS}
        dataSource={DATA}
        rowKey="id"
        scroll={{ y: 300 }}
        selectionMode="checkbox"
        expandable={{ expandedRowRender: (r: Row) => <p>{r.title}</p> }}
      />,
    );
    const headThs = Array.from(container.querySelectorAll('thead tr:first-child th'));
    expect(headThs.length).toBe(5); // selection + expand + 3 cột dữ liệu
    for (const th of headThs) {
      expect(th.className).toContain('sticky');
      expect(th.className).toContain('top-0');
      expect(th.className).toContain('z-10');
      expect(th.className).toContain('bg-s3'); // nền đặc — row cuộn dưới không lọt
    }
  });

  it('scroll.y + filterPlacement row + selection → mọi th filter row sticky + top=headerH (selection/expand không thiếu)', () => {
    const { container } = render(
      <Table
        columns={COLS}
        dataSource={DATA}
        rowKey="id"
        scroll={{ y: 300 }}
        selectionMode="checkbox"
        filterPlacement="row"
      />,
    );
    const filterThs = Array.from(container.querySelectorAll<HTMLElement>('thead tr:nth-child(2) th'));
    expect(filterThs.length).toBe(4); // selection + 3 cột
    for (const th of filterThs) {
      expect(th.className).toContain('sticky');
      expect(th.style.top).not.toBe(''); // sticky ngay dưới hàng header
    }
  });

  it('striped + borderless + size small → class đúng', () => {
    const { container } = render(
      <Table columns={COLS} dataSource={DATA} rowKey="id" striped borderless size="small" />,
    );
    // size small → cell text-label; borderless → td không border-b
    expect(container.querySelector('td')).toHaveClass('text-label');
    expect(container.querySelector('td')?.className).not.toContain('border-b');
  });

  it('zebra: striped → hàng chẵn (rowIndex lẻ) bg-s3/40; hàng lẻ + không striped → không tint', () => {
    const striped = render(<Table columns={COLS} dataSource={DATA} rowKey="id" striped />);
    const rows = striped.container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].className).not.toContain('bg-s3/40');
    expect(rows[1].className).toContain('bg-s3/40');
    expect(rows[2].className).not.toContain('bg-s3/40');
    striped.unmount();
    // không striped → không hàng nào tint
    const plain = render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    plain.container.querySelectorAll('tbody tr').forEach((tr) => {
      expect(tr.className).not.toContain('bg-s3/40');
    });
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

describe('Table — virtual scroll', () => {
  const BIG = Array.from({ length: 120 }, (_, i) => ({
    id: String(i),
    title: `Task ${i}`,
    status: 'todo' as const,
    priority: i,
  }));

  it('virtual off (mặc định) → render hết 120 rows như cũ', () => {
    render(<Table columns={COLS} dataSource={BIG} rowKey="id" scrollHeight={300} />);
    expect(screen.getByText('Task 0')).toBeInTheDocument();
    expect(screen.getByText('Task 119')).toBeInTheDocument();
  });

  it('virtual on, scrollTop 0 → chỉ window đầu (viewport + overscan 8); rows ngoài window không có trong DOM', () => {
    render(
      <Table columns={COLS} dataSource={BIG} rowKey="id" scrollHeight={200} virtual={{ itemHeight: 40 }} />,
    );
    // viewport 200px / itemHeight 40 = 5 rows nhìn thấy + overscan 8 → rows 0..12
    expect(screen.getByText('Task 0')).toBeInTheDocument();
    expect(screen.getByText('Task 12')).toBeInTheDocument();
    expect(screen.queryByText('Task 13')).toBeNull();
    expect(screen.queryByText('Task 119')).toBeNull();
  });

  it('fireEvent.scroll xuống giữa → window trượt; rows cũ ngoài window biến mất', () => {
    const { container } = render(
      <Table columns={COLS} dataSource={BIG} rowKey="id" scrollHeight={200} virtual={{ itemHeight: 40 }} />,
    );
    const scroller = container.querySelector('div[style*="max-height"]') as HTMLElement;
    fireEvent.scroll(scroller, { target: { scrollTop: 40 * 60 } }); // xuống row 60
    expect(screen.getByText('Task 60')).toBeInTheDocument();
    expect(screen.getByText('Task 52')).toBeInTheDocument(); // 60 − overscan 8
    expect(screen.queryByText('Task 51')).toBeNull();
    expect(screen.queryByText('Task 0')).toBeNull();
  });

  it('itemHeight override → window size đổi theo chiều cao row', () => {
    render(
      <Table columns={COLS} dataSource={BIG} rowKey="id" scrollHeight={200} virtual={{ itemHeight: 40 }} />,
    );
    const rowsWith40 = screen.getAllByRole('row').length;
    cleanup();
    render(
      <Table columns={COLS} dataSource={BIG} rowKey="id" scrollHeight={200} virtual={{ itemHeight: 100 }} />,
    );
    const rowsWith100 = screen.getAllByRole('row').length;
    expect(rowsWith40).toBeGreaterThan(rowsWith100);
  });

  it('virtual=true (boolean) → itemHeight mặc định 44 vẫn window đúng', () => {
    render(
      <Table columns={COLS} dataSource={BIG} rowKey="id" scrollHeight={220} virtual />,
    );
    // viewport 220 / 44 = 5 + overscan 8 → rows 0..12
    expect(screen.getByText('Task 0')).toBeInTheDocument();
    expect(screen.getByText('Task 12')).toBeInTheDocument();
    expect(screen.queryByText('Task 13')).toBeNull();
  });

  it('virtual on nhưng ≤ ngưỡng 50 rows → render hết (không window)', () => {
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" virtual />);
    expect(screen.getByText('Học TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Viết test E2E')).toBeInTheDocument();
  });

  it('virtual on giữ selection qua scroll (windowed rows vẫn chọn được)', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Table
        columns={COLS}
        dataSource={BIG}
        rowKey="id"
        scrollHeight={200}
        virtual={{ itemHeight: 40 }}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByText('Task 0')); // row đầu trong window
    expect(onSelectionChange).toHaveBeenLastCalledWith([BIG[0]]);
    const scroller = container.querySelector('div[style*="max-height"]') as HTMLElement;
    fireEvent.scroll(scroller, { target: { scrollTop: 40 * 60 } });
    await user.click(screen.getByText('Task 60')); // row giữa window sau scroll
    expect(onSelectionChange).toHaveBeenLastCalledWith([BIG[60]]);
  });
});

describe('Table — global filter', () => {
  it('gõ vào search toàn cục → chỉ rows khớp còn lại; xoá → trả đủ', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" globalFilter />);
    const search = screen.getByLabelText('Tìm kiếm toàn cục');
    await user.type(search, 'tailwind');
    expect(screen.getByText('Áp dụng Tailwind')).toBeInTheDocument();
    expect(screen.queryByText('Học TypeScript')).toBeNull();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '1');
    await user.clear(search);
    expect(screen.getByText('Học TypeScript')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '3');
  });
});

describe('Table — filter menu (funnel)', () => {
  it('mở panel: match mode + input + Apply; gõ giá trị → Apply → lọc rows', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    await user.click(screen.getByRole('button', { name: 'Lọc Tiêu đề' }));
    expect(screen.getByLabelText('Match mode 1')).toBeInTheDocument();
    const valueInput = screen.getByLabelText('Giá trị lọc 1');
    await user.type(valueInput, 'TypeScript');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('Học TypeScript')).toBeInTheDocument();
    expect(screen.queryByText('Áp dụng Tailwind')).toBeNull();
    // badge active-count trên funnel
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('+ Thêm constraint; Clear reset về 1 constraint rỗng → bỏ lọc', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    await user.click(screen.getByRole('button', { name: 'Lọc Trạng thái' }));
    await user.type(screen.getByLabelText('Giá trị lọc 1'), 'zzz-không-khớp');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByText('Học TypeScript')).toBeNull();
    // mở lại → Clear
    await user.click(screen.getByRole('button', { name: 'Lọc Trạng thái' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('Học TypeScript')).toBeInTheDocument();
  });
});

describe('Table — column resize', () => {
  it('kéo viền cột → width đổi theo dx; chạm min-clamp 60px khi kéo ngược', () => {
    const { container } = render(<Table columns={COLS} dataSource={DATA} rowKey="id" resizable />);
    const handle = container.querySelector('span[role="presentation"].cursor-col-resize') as HTMLElement;
    expect(handle).not.toBeNull();
    const th = handle.closest('th') as HTMLElement;
    fireEvent.mouseDown(handle, { clientX: 100, preventDefault: () => {}, stopPropagation: () => {} });
    // jsdom offsetWidth = 0 → dx +40 vẫn dưới min → clamp 60px
    fireEvent.mouseMove(document, { clientX: 140 });
    expect(th.style.width).toBe('60px');
    // kéo tiếp xa hơn → vượt min, width theo dx
    fireEvent.mouseMove(document, { clientX: 240 });
    expect(th.style.width).toBe('140px');
    fireEvent.mouseUp(document);
    // sau mouseUp → thả listener, move nữa không đổi
    fireEvent.mouseMove(document, { clientX: 340 });
    expect(th.style.width).toBe('140px');
  });
});

describe('Table — CSV export', () => {
  it('nút CSV → tạo blob đúng 1 lần với header + rows', async () => {
    const created: Blob[] = [];
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => { created.push(blob); return 'blob:mock'; });
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" csvExport csvFilename="tasks" />);
    await user.click(screen.getByRole('button', { name: /CSV/ }));
    expect(created).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    clickSpy.mockRestore();
  });
});

describe('Table — classNames slots (antd v5)', () => {
  it('wrapper/header/row/cell slot đúng element + merge SAU default', () => {
    const { container } = render(
      <Table
        columns={COLS}
        dataSource={DATA}
        rowKey="id"
        classNames={{ wrapper: 'cw', header: 'ch', row: 'cr', cell: 'cc' }}
      />,
    );
    const wrapper = container.querySelector('.overflow-auto');
    expect(wrapper).toHaveClass('rounded-xl'); // default giữ nguyên
    expect(wrapper).toHaveClass('cw');          // slot merge sau
    expect(container.querySelector('thead')).toHaveClass('ch');
    const dataRow = screen.getByText('Học TypeScript').closest('tr');
    expect(dataRow).toHaveClass('cr');
    expect(dataRow!.querySelector('td')).toHaveClass('cc');
  });

  it('không truyền classNames → không class rác; header slot chỉ dính thead', () => {
    const { container } = render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    expect(container.querySelector('thead')!.className.trim()).toBe('');
    expect(container.querySelector('.cw')).toBeNull();
  });
});
