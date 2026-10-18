// Steps tests — done/current/waiting states + description.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Steps } from './index.js';

afterEach(cleanup);

const ITEMS = [
  { title: 'Đặt hàng', description: 'Giỏ hàng' },
  { title: 'Thanh toán' },
  { title: 'Hoàn tất' },
];

describe('Steps', () => {
  it('current=1: step 0 done (tick), step 1 current (số), step 2 waiting', () => {
    render(<Steps items={ITEMS} current={1} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Đặt hàng')).toBeInTheDocument();
    expect(screen.getByText('Giỏ hàng')).toBeInTheDocument();
  });

  it('current cuối → tất cả trước done', () => {
    render(<Steps items={ITEMS} current={2} />);
    expect(screen.getAllByText('✓').length).toBe(2);
  });
});

describe('Steps — branch phụ', () => {
  it('current=0 → step đầu current (chưa có tick)', () => {
    render(<Steps items={ITEMS} current={0} />);
    expect(screen.queryByText('✓')).toBeNull();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('description chỉ render khi truyền (step 2 không description)', () => {
    render(<Steps items={ITEMS} current={1} />);
    expect(screen.queryByText(/Thanh toán.*description/)).toBeNull();
  });

  it('a11y: aria-current="step" đúng li đang current; li khác không có', () => {
    render(<Steps items={ITEMS} current={1} />);
    const lis = document.querySelectorAll('ol > li');
    expect(lis[1]).toHaveAttribute('aria-current', 'step');
    expect(lis[0]).not.toHaveAttribute('aria-current');
    expect(lis[2]).not.toHaveAttribute('aria-current');
  });

  it('edge: current vượt quá số step → tất cả done; current=99 không crash', () => {
    render(<Steps items={ITEMS} current={99} />);
    expect(screen.getAllByText('✓').length).toBe(ITEMS.length);
    expect(document.querySelectorAll('[aria-current="step"]').length).toBe(0);
  });
});
