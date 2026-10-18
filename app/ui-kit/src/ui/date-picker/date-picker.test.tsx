import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from './index.js';
afterEach(cleanup);
describe('DatePicker', () => {
  it('click trigger → calendar mở; chọn ngày → onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker onChange={onChange} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    fireEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalled();
  });
  it('placeholder khi không value', () => {
    render(<DatePicker placeholder="Chọn ngày…" />);
    expect(screen.getByText('Chọn ngày…')).toBeInTheDocument();
  });
});

describe('DatePicker — range (batch ⑧ worker C)', () => {
  const NOW = new Date(2026, 9, 15); // 15/10/2026

  it('2 input from/to render; chọn from → to → onChange nhận [start, end]', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker range now={NOW} onChange={onChange} />);
    expect(screen.getByLabelText('Từ ngày')).toBeInTheDocument();
    expect(screen.getByLabelText('Đến ngày')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Từ ngày'));
    fireEvent.click(screen.getByText('10')); // start
    fireEvent.click(screen.getByText('20')); // end → hoàn thành
    expect(onChange).toHaveBeenCalledWith([new Date(2026, 9, 10), new Date(2026, 9, 20)]);
  });

  it('hover preview: sau khi chọn start, hover ngày giữa → ô trong khoảng bg-accent/10 (như antd RangePicker)', async () => {
    const user = userEvent.setup();
    render(<DatePicker range now={NOW} />);
    await user.click(screen.getByLabelText('Từ ngày'));
    fireEvent.click(screen.getByText('10')); // start → phase 'to'
    fireEvent.mouseEnter(screen.getByLabelText(new Date(2026, 9, 18).toDateString()));
    const mid = screen.getByLabelText(new Date(2026, 9, 15).toDateString());
    expect(mid).toHaveClass('bg-accent/10');
    const outside = screen.getByLabelText(new Date(2026, 9, 25).toDateString());
    expect(outside).not.toHaveClass('bg-accent/10');
  });

  it('chọn lùi (end < start) → swap: onChange vẫn [min, max]', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker range now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Từ ngày'));
    fireEvent.click(screen.getByText('20'));
    fireEvent.click(screen.getByText('10'));
    expect(onChange).toHaveBeenCalledWith([new Date(2026, 9, 10), new Date(2026, 9, 20)]);
  });

  it('single mode giữ behavior cũ: click 1 ngày → onChange + đóng panel', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    fireEvent.click(screen.getByText('12'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 12));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});

describe('DatePicker — showTime (batch ⑧ worker C)', () => {
  const NOW = new Date(2026, 9, 15);

  it('cột giờ bên phải panel; chọn ngày + tăng giờ → giá trị mang theo giờ; OK đóng panel', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker showTime now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    fireEvent.click(screen.getByText('15'));
    // panel KHÔNG tự đóng khi showTime — chờ OK
    expect(screen.getByRole('grid')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tăng giờ')); // 00 → 01
    // spinner đổi → onChange phát ngay giá trị compose (15/10 01:00)
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 15, 1, 0));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('không showTime: không có nút OK', async () => {
    const user = userEvent.setup();
    render(<DatePicker now={NOW} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    expect(screen.queryByRole('button', { name: 'OK' })).not.toBeInTheDocument();
  });
});

describe('DatePicker — locale (batch ⑧ worker C)', () => {
  const NOW = new Date(2026, 9, 15);

  it('locale="en" → label tháng + aria nav tiếng Anh', async () => {
    const user = userEvent.setup();
    render(<DatePicker locale="en" now={NOW} />);
    await user.click(screen.getByLabelText('Pick date'));
    expect(screen.getByText(/October 2026/)).toBeInTheDocument();
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
  });

  it('default vi — trigger + tháng tiếng Việt', async () => {
    render(<DatePicker now={NOW} />);
    expect(screen.getByLabelText('Chọn ngày')).toBeInTheDocument();
  });

  it('nút "Hôm nay" → onChange hôm nay (label theo locale)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    fireEvent.click(screen.getByText('Hôm nay'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15));
  });
});
