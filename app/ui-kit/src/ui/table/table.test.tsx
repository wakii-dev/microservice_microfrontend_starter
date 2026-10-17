// Table (lightweight) tests — columns/dataSource/render/empty.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Table } from './index.js';

interface Row { id: string; title: string; status: string }

const COLS = [
  { key: 'title', title: 'Tiêu đề' },
  { key: 'status', title: 'Trạng thái', render: (r: Row) => <strong>{r.status}</strong> },
];

const DATA: Row[] = [
  { id: '1', title: 'Task A', status: 'todo' },
  { id: '2', title: 'Task B', status: 'done' },
];

afterEach(cleanup);

describe('Table', () => {
  it('header + rows + render cell tuỳ ý', () => {
    render(<Table columns={COLS} dataSource={DATA} rowKey="id" />);
    expect(screen.getByText('Tiêu đề')).toBeInTheDocument();
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('todo').tagName).toBe('STRONG');
  });

  it('dataSource rỗng → thông báo không dữ liệu', () => {
    render(<Table columns={COLS} dataSource={[]} rowKey="id" />);
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
  });
});
