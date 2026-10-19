import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { DebtBoard } from './index.js';

afterEach(cleanup);

const DEBTS = [
  { item: 'R6 — dirty file đụng trúng', owner: 'v2', status: 'fixed' as const },
  { item: 'hex cứng trong story', owner: 'v1', status: 'open' as const },
  { item: 'relative path root', owner: 'v1', status: 'waived' as const },
];

describe('DebtBoard', () => {
  it('render bảng: item + owner Badge + status màu', () => {
    render(<DebtBoard debts={DEBTS} />);
    expect(screen.getByText('hex cứng trong story')).toBeInTheDocument();
    expect(screen.getAllByText('v1')).toHaveLength(2);
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('fixed')).toBeInTheDocument();
  });

  it('filter owner (combobox) → chỉ hàng owner đó', async () => {
    const user = userEvent.setup();
    render(<DebtBoard debts={DEBTS} />);
    await user.click(screen.getByRole('combobox', { name: 'Lọc theo owner' }));
    await user.click(screen.getByRole('option', { name: 'v2' }));
    expect(screen.getByText('R6 — dirty file đụng trúng')).toBeInTheDocument();
    expect(screen.queryByText('hex cứng trong story')).toBeNull();
  });

  it('filter status (combobox) → chỉ hàng status đó', async () => {
    const user = userEvent.setup();
    render(<DebtBoard debts={DEBTS} />);
    await user.click(screen.getByRole('combobox', { name: 'Lọc theo status' }));
    await user.click(screen.getByRole('option', { name: 'Open' }));
    expect(screen.getByText('hex cứng trong story')).toBeInTheDocument();
    expect(screen.queryByText('R6 — dirty file đụng trúng')).toBeNull();
  });

  it('lọc không khớp → EmptyState', async () => {
    const user = userEvent.setup();
    render(<DebtBoard debts={DEBTS} />);
    await user.click(screen.getByRole('combobox', { name: 'Lọc theo owner' }));
    await user.click(screen.getByRole('option', { name: 'v2' }));
    await user.click(screen.getByRole('combobox', { name: 'Lọc theo status' }));
    await user.click(screen.getByRole('option', { name: 'Open' }));
    expect(screen.getByText('Không có debt khớp bộ lọc')).toBeInTheDocument();
  });
});

describe('DebtBoard — queue depth + R0.1 hint', () => {
  it('queueDepth truyền → cột Queue hiện số', () => {
    render(<DebtBoard debts={DEBTS} queueDepth={3} agentsIdle={0} />);
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getAllByText('3')).toHaveLength(3);
  });

  it('debts>0 + queue=0 + idle>0 → hint "cần phân công" đỏ', () => {
    render(<DebtBoard debts={DEBTS} queueDepth={0} agentsIdle={2} />);
    const hints = screen.getAllByText('cần phân công');
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0].className).toContain('text-st-fail');
  });

  it('điều kiện không đủ (queue>0 hoặc idle=0 hoặc hết debts) → không hint', () => {
    const { rerender } = render(<DebtBoard debts={DEBTS} queueDepth={2} agentsIdle={2} />);
    expect(screen.queryByText('cần phân công')).toBeNull();
    rerender(<DebtBoard debts={DEBTS} queueDepth={0} agentsIdle={0} />);
    expect(screen.queryByText('cần phân công')).toBeNull();
  });
});
