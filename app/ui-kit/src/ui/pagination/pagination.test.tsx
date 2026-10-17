// Pagination tests — pageList window ±1 + đầu/cuối + ellipsis; item current/aria.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Pagination, pageList } from './index.js';

afterEach(cleanup);

describe('pageList', () => {
  it('≤7 trang → đầy đủ không ellipsis', () => {
    expect(pageList(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('giữa xa biên → 1 … p-1 p p+1 … N', () => {
    expect(pageList(5, 10)).toEqual([1, 'ellipsis-prev', 4, 5, 6, 'ellipsis-next', 10]);
  });

  it('current=1 → không ellipsis-prev', () => {
    expect(pageList(1, 10)).toEqual([1, 2, 'ellipsis-next', 10]);
  });
});

describe('Pagination', () => {
  it('current → aria-current + nền accent; prev disabled ở trang 1', () => {
    render(<Pagination current={1} pageSize={10} total={100} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Trang 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled();
  });

  it('click trang → onChange(page)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination current={1} pageSize={10} total={100} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('ellipsis click → jump ±5', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination current={5} pageSize={10} total={100} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Tiến 5 trang' }));
    expect(onChange).toHaveBeenCalledWith(10);
    await user.click(screen.getByRole('button', { name: 'Lùi 5 trang' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('Pagination — branch phụ', () => {
  it('click trang hiện tại → onChange KHÔNG gọi (guard === current)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination current={2} pageSize={10} total={100} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('total nhỏ → pageCount tối thiểu 1', () => {
    render(<Pagination current={1} pageSize={10} total={5} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });
});

describe('Pagination — guard branch', () => {
  it('click trang hiện tại (Trang 1 ở current=1) → guard không gọi onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination current={1} pageSize={10} total={50} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Trang 1' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Pagination — branch phụ 2', () => {
  it('pageCount ≤ 7 → không có ellipsis', () => {
    render(<Pagination current={4} pageSize={10} total={70} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Trang 1' })).toBeInTheDocument();
    expect(screen.queryByText('•••')).toBeNull();
  });
});

describe('Pagination — branch phụ (Tier 5 sweep)', () => {
  it('prev disabled ở trang 1; next disabled ở trang cuối', () => {
    render(<Pagination current={10} pageSize={10} total={100} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled();
  });
});
