import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from './index.js';
afterEach(cleanup);
describe('Calendar', () => {
  it('month + VN days + today + click onChange', () => {
    const now = new Date(2026, 9, 15);
    const onChange = vi.fn();
    render(<Calendar now={now} onChange={onChange} />);
    expect(screen.getByText(/Tháng 10/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('20'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 20));
  });
  it('prev/next navigation', () => {
    render(<Calendar now={new Date(2026, 9, 15)} />);
    fireEvent.click(screen.getByLabelText('Tháng trước'));
    expect(screen.getByText(/Tháng 9/)).toBeInTheDocument();
  });
});
