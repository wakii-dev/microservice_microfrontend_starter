// OrderList tests — render đánh số, ▼/▲ đổi chỗ + onChange, ranh giới disabled.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderList } from './index.js';

const ITEMS = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
  { label: 'Gamma', value: 'g' },
];

afterEach(cleanup);

describe('OrderList', () => {
  it('render items đánh số thứ tự 1./2./3.', () => {
    render(<OrderList items={ITEMS} />);
    expect(screen.getByText('1. Alpha')).toBeInTheDocument();
    expect(screen.getByText('2. Beta')).toBeInTheDocument();
    expect(screen.getByText('3. Gamma')).toBeInTheDocument();
  });

  it('click ▼ item đầu → đổi chỗ với item sau + onChange thứ tự mới', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OrderList items={ITEMS} onChange={onChange} />);
    await user.click(screen.getAllByRole('button', { name: 'Xuống' })[0]!);
    expect(onChange).toHaveBeenCalledWith([ITEMS[1], ITEMS[0], ITEMS[2]]);
    expect(screen.getByText('1. Beta')).toBeInTheDocument();
    expect(screen.getByText('2. Alpha')).toBeInTheDocument();
  });

  it('click ▲ item cuối → lên trên; ranh giới đầu/cuối disabled', async () => {
    const user = userEvent.setup();
    render(<OrderList items={ITEMS} />);
    const ups = screen.getAllByRole('button', { name: 'Lên' });
    const downs = screen.getAllByRole('button', { name: 'Xuống' });
    expect(ups[0]).toBeDisabled(); // Alpha không lên được nữa
    expect(downs[downs.length - 1]).toBeDisabled(); // Gamma không xuống được nữa
    await user.click(ups[ups.length - 1]!); // Gamma lên một bậc
    expect(screen.getByText('2. Gamma')).toBeInTheDocument();
    expect(screen.getByText('3. Beta')).toBeInTheDocument();
  });

  it('reorder chuỗi: ▼×2 đưa item cuối lên đầu? (đổi chỗ từng cặp)', async () => {
    const user = userEvent.setup();
    render(<OrderList items={ITEMS} />);
    await user.click(screen.getAllByRole('button', { name: 'Xuống' })[0]!);
    await user.click(screen.getAllByRole('button', { name: 'Xuống' })[1]!);
    expect(screen.getByText('1. Beta')).toBeInTheDocument();
    expect(screen.getByText('2. Gamma')).toBeInTheDocument();
    expect(screen.getByText('3. Alpha')).toBeInTheDocument();
  });
});
