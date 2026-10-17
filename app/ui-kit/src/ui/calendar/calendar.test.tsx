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

describe('Calendar — states ngôn ngữ nút Pagination', () => {
  const now = new Date(2026, 9, 17); // 17/10/2026 = today

  it('ngày thường → outline border-line + hover:bg-s3; selected → accent đặc + trắng + không viền', () => {
    render(<Calendar now={now} value={new Date(2026, 9, 20)} />);
    const normal = screen.getByLabelText(new Date(2026, 9, 15).toDateString());
    expect(normal).toHaveClass('border-line', 'hover:bg-s3', 'bg-transparent');
    expect(normal).not.toHaveClass('bg-accent');
    const selected = screen.getByLabelText(new Date(2026, 9, 20).toDateString());
    expect(selected).toHaveClass('bg-accent', 'text-white', 'font-medium');
    expect(selected).not.toHaveClass('border-line');
  });

  it('today → outline + ring accent + text accent (không đổi nền)', () => {
    render(<Calendar now={now} />);
    const today = screen.getByLabelText(now.toDateString());
    expect(today).toHaveClass('border-line', 'ring-accent', 'text-accent');
    expect(today).not.toHaveClass('bg-accent');
  });

  it('adjacent tháng khác → disabled, không viền, không hover bg', () => {
    render(<Calendar now={now} />);
    const adj = screen.getByLabelText(new Date(2026, 8, 28).toDateString()); // 28/9
    expect(adj).toBeDisabled();
    expect(adj).not.toHaveClass('border-line');
    expect(adj).not.toHaveClass('hover:bg-s3');
    expect(adj).toHaveClass('text-ink3', 'cursor-not-allowed');
  });

  it('nav tháng → SVG chevron trong ô outline (không còn ký tự ‹ ›)', () => {
    render(<Calendar now={now} />);
    const prev = screen.getByLabelText('Tháng trước');
    expect(prev.querySelector('svg')).not.toBeNull();
    expect(prev).toHaveClass('border-line');
    expect(screen.getByLabelText('Tháng sau').querySelector('svg')).not.toBeNull();
  });
});
