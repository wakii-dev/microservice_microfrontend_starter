// Table advanced tests — 3 nhóm: fixed header (scroll.y) · summary row · sorting
// 3-state + aria-sort. Bổ sung quanh hành vi có sẵn, không đụng test cũ.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Table } from './index.js';

afterEach(cleanup);

interface Row { id: string; title: string; point: number }
const ROWS: Row[] = [
  { id: '1', title: 'Alpha', point: 3 },
  { id: '2', title: 'Beta', point: 8 },
  { id: '3', title: 'Gamma', point: 5 },
];
const COLS = [
  { key: 'title', title: 'Title', sortable: true },
  { key: 'point', title: 'Point', dataType: 'number' as const, sortable: true, align: 'right' as const },
];

describe('Table — fixed header (scroll.y)', () => {
  it('scroll={{ y: 240 }} → wrapper max-height 240px + overflow-auto', () => {
    const { container } = render(<Table columns={COLS} dataSource={ROWS} rowKey="id" scroll={{ y: 240 }} />);
    const wrapper = container.querySelector('div.overflow-auto')!;
    expect(wrapper).toHaveStyle({ maxHeight: '240px' });
    expect(wrapper.className).toContain('overflow-auto');
  });

  it('thead th có class sticky (fixed header) — hàng header dính khi cuộn', () => {
    const { container } = render(<Table columns={COLS} dataSource={ROWS} rowKey="id" scroll={{ y: 120 }} />);
    const ths = container.querySelectorAll('thead th');
    expect(ths.length).toBeGreaterThan(0);
    ths.forEach((th) => expect(th.className).toContain('sticky'));
  });

  it('scrollHeight (API cũ) vẫn hoạt động → max-height; scroll.y ưu tiên khi cả hai có', () => {
    const { container, rerender } = render(
      <Table columns={COLS} dataSource={ROWS} rowKey="id" scrollHeight={100} />,
    );
    expect(container.querySelector('div.overflow-auto')).toHaveStyle({ maxHeight: '100px' });
    rerender(<Table columns={COLS} dataSource={ROWS} rowKey="id" scrollHeight={100} scroll={{ y: 300 }} />);
    expect(container.querySelector('div.overflow-auto')).toHaveStyle({ maxHeight: '300px' });
  });

  it('filterPlacement="row" + scroll.y → filter row sticky ngay dưới header (style top đo được)', () => {
    const { container } = render(
      <Table
        columns={[{ key: 'title', title: 'Title', filterable: true }, ...COLS.slice(1)]}
        dataSource={ROWS}
        rowKey="id"
        scroll={{ y: 200 }}
        filterPlacement="row"
      />,
    );
    const filterTh = container.querySelectorAll('thead tr')[1]!.querySelector('th')!;
    expect(filterTh.className).toContain('sticky');
    expect(filterTh.style.top).toBeDefined(); // jsdom offsetHeight = 0 → top '0px', real browser đo đúng
  });
});

describe('Table — summary row', () => {
  it('summary nhận toàn bộ data (đã sort) và render trong <tfoot>', () => {
    const seen: Row[][] = [];
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        summary={(data) => {
          seen.push(data);
          return <span>Total: {data.reduce((s, r) => s + r.point, 0)}</span>;
        }}
      />,
    );
    expect(seen[0]).toHaveLength(3);
    expect(screen.getByText('Total: 16')).toBeInTheDocument();
    expect(screen.getByText('Total: 16').closest('tfoot')).not.toBeNull();
  });

  it('tfoot td sticky bottom-0 + bg-s3 + colSpan đủ (cột + selection)', () => {
    const { container } = render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        selectionMode="checkbox"
        summary={() => <span>Σ</span>}
      />,
    );
    const td = container.querySelector('tfoot td')!;
    expect(td.className).toContain('sticky');
    expect(td.className).toContain('bottom-0');
    expect(td.className).toContain('bg-s3');
    expect(td).toHaveAttribute('colspan', '3'); // 2 cột + 1 selection
  });

  it('paginator: sang trang 2 → summary nhận đúng data TRANG HIỆN TẠI', async () => {
    const big: Row[] = Array.from({ length: 4 }, (_, i) => ({ id: String(i + 1), title: `T${i + 1}`, point: i + 1 }));
    const seen: Row[][] = [];
    const user = userEvent.setup();
    render(
      <Table
        columns={COLS}
        dataSource={big}
        rowKey="id"
        paginator
        pageSize={2}
        summary={(data) => {
          seen.push([...data]);
          return <span>Page total: {data.reduce((s, r) => s + r.point, 0)}</span>;
        }}
      />,
    );
    expect(seen.at(-1)!.map((r) => r.id)).toEqual(['1', '2']);
    // next page
    await user.click(screen.getAllByRole('button', { name: /2|›|Next/ }).at(-1)!);
    expect(seen.at(-1)!.map((r) => r.id)).toEqual(['3', '4']);
  });

  it('loading → KHÔNG render tfoot summary (skeleton thay)', () => {
    const { container } = render(
      <Table columns={COLS} dataSource={ROWS} rowKey="id" loading summary={() => <span>Σ</span>} />,
    );
    expect(container.querySelector('tfoot')).toBeNull();
    expect(screen.queryByText('Σ')).toBeNull();
  });
});

describe('Table — sorting 3-state + aria-sort', () => {
  function headerButton(name: string) {
    return screen.getByText(name).closest('button')!;
  }

  it('aria-sort: asc → ascending, desc → descending, none → bỏ attr', async () => {
    const th = () => headerButton('Title').closest('th')!;
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={ROWS} rowKey="id" />);
    await user.click(headerButton('Title'));
    expect(th()).toHaveAttribute('aria-sort', 'ascending');
    await user.click(headerButton('Title'));
    expect(th()).toHaveAttribute('aria-sort', 'descending');
    await user.click(headerButton('Title'));
    expect(th()).not.toHaveAttribute('aria-sort');
  });

  it('desc thật sự đảo thứ tự (point desc → 8, 5, 3)', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={ROWS} rowKey="id" />);
    await user.click(headerButton('Point')); // asc: 3,5,8
    await user.click(headerButton('Point')); // desc: 8,5,3
    const firstCells = screen.getAllByRole('row')
      .map((r) => r.querySelector('td')?.textContent)
      .filter((t) => t && ['Alpha', 'Beta', 'Gamma'].includes(t));
    expect(firstCells).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('click lần 3 (none) → thứ tự về gốc như dataSource + indicator về ⇅', async () => {
    const user = userEvent.setup();
    render(<Table columns={COLS} dataSource={ROWS} rowKey="id" />);
    await user.click(headerButton('Point'));
    await user.click(headerButton('Point'));
    await user.click(headerButton('Point'));
    const rows = screen.getAllByRole('row')
      .map((r) => r.querySelector('td')?.textContent)
      .filter((t) => t && ['Alpha', 'Beta', 'Gamma'].includes(t));
    expect(rows).toEqual(['Alpha', 'Beta', 'Gamma']); // gốc
    const btn = headerButton('Point');
    expect(btn.textContent).toContain('⇅'); // indicator none
  });

  it('sort không phá summary — summary vẫn nhận data theo sort hiện tại', async () => {
    const seen: string[][] = [];
    const user = userEvent.setup();
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        summary={(d) => {
          seen.push(d.map((r) => r.id));
          return null;
        }}
      />,
    );
    await user.click(headerButton('Point'));
    expect(seen.at(-1)).toEqual(['1', '3', '2']); // asc point: 3,5,8
  });
});
