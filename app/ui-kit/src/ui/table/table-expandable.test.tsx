// Table expandable tests — antd `expandable` config (Gap P0): cột expander tự
// inject (chevron-down xoay 90 khi mở), expandedRowRender colspan đầy,
// defaultExpandedRowKeys mở sẵn, rowExpandable=false → không nút.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Table } from './index.js';

afterEach(cleanup);

interface Row { id: string; title: string; point: number }
const ROWS: Row[] = [
  { id: '1', title: 'Setup repo', point: 3 },
  { id: '2', title: 'Add CI', point: 5 },
  { id: '3', title: 'Ship demo', point: 8 },
];
const COLS = [
  { key: 'title', title: 'Title' },
  { key: 'point', title: 'Point', align: 'right' as const },
];

describe('Table — expandable (antd API)', () => {
  it('expandable không cần cột expander thủ công → cột chevron tự inject (aria-expanded=false)', () => {
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{ expandedRowRender: (r) => <p>Detail {r.id}</p> }}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: 'Mở rộng dòng' });
    expect(buttons).toHaveLength(3);
    buttons.forEach((b) => expect(b).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.queryByText('Detail 1')).toBeNull();
  });

  it('click chevron → aria-expanded=true + expandedRowRender hiện; click lần nữa → thu lại', async () => {
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{ expandedRowRender: (r) => <p>Detail {r.title}</p> }}
      />,
    );
    const btn = screen.getAllByRole('button', { name: 'Mở rộng dòng' })[1];
    await userEvent.setup().click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Detail Add CI')).toBeInTheDocument();
    await userEvent.setup().click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Detail Add CI')).toBeNull();
  });

  it('chevron-down + xoay 90 khi mở (class rotate-90)', async () => {
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{ expandedRowRender: (r) => <p>{r.id}</p> }}
      />,
    );
    const btn = screen.getAllByRole('button', { name: 'Mở rộng dòng' })[0];
    const icon = btn.querySelector('svg')!;
    // chevron-down của bộ primeicons — path phẩy xuống (khác chevron-right của legacy rowExpansion)
    expect(btn.textContent).not.toContain('▸');
    expect(btn.querySelector('span')).toHaveClass('transition-transform');
    expect(btn.querySelector('span')).not.toHaveClass('rotate-90');
    await userEvent.setup().click(btn);
    expect(btn.querySelector('span')).toHaveClass('rotate-90');
    expect(icon).toBeInTheDocument();
  });

  it('row con colspan đầy (số cột + cột expander)', async () => {
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{ expandedRowRender: (r) => <p>Detail {r.id}</p> }}
      />,
    );
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Mở rộng dòng' })[0]);
    const expandedTd = screen.getByText('Detail 1').closest('td')!;
    expect(expandedTd).toHaveAttribute('colspan', '3'); // 2 cột dữ liệu + 1 expander
  });

  it('defaultExpandedRowKeys → row mở sẵn lúc mount', () => {
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{
          expandedRowRender: (r) => <p>Detail {r.id}</p>,
          defaultExpandedRowKeys: ['2'],
        }}
      />,
    );
    expect(screen.getByText('Detail 2')).toBeInTheDocument();
    expect(screen.queryByText('Detail 1')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Mở rộng dòng' })[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('rowExpandable=false → không render nút expand cho row đó, các row khác bình thường', async () => {
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{
          expandedRowRender: (r) => <p>Detail {r.id}</p>,
          rowExpandable: (r) => r.id !== '2',
        }}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: 'Mở rộng dòng' });
    expect(buttons).toHaveLength(2); // row 2 không có nút
    await userEvent.setup().click(buttons[0]);
    expect(screen.getByText('Detail 1')).toBeInTheDocument();
  });

  it('expandable + onExpandedRowRender index param được truyền đúng (render theo index)', async () => {
    const renderSpy = vi.fn((r: Row, i: number) => <p>#{i} {r.title}</p>);
    render(
      <Table
        columns={COLS}
        dataSource={ROWS}
        rowKey="id"
        expandable={{ expandedRowRender: renderSpy }}
      />,
    );
    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Mở rộng dòng' })[2]);
    expect(renderSpy).toHaveBeenCalledWith(ROWS[2], 2);
    expect(screen.getByText('#2 Ship demo')).toBeInTheDocument();
  });
});
