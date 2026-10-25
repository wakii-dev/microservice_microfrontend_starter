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

describe('DatePicker — polish (placeholder contrast / panel min-w / footer buttons)', () => {
  it('placeholder khi rỗng → text-ink (contrast fix, không còn ink4/ink2)', () => {
    render(<DatePicker placeholder="Chọn ngày…" />);
    const trigger = screen.getByRole('button', { name: /Chọn ngày/ });
    const span = trigger.querySelector('span')!;
    expect(span).toHaveClass('text-ink');
    expect(span).not.toHaveClass('text-ink4');
    expect(span).not.toHaveClass('text-ink2');
  });

  it('panel có min-w-[300px] (nhãn tháng/năm không bị chật)', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    await user.click(screen.getByRole('button', { name: /Chọn ngày|Hôm nay/ }));
    const panel = document.body.querySelector('[class*="min-w-[300px]"]');
    expect(panel).not.toBeNull();
  });

  it('nút "Hôm nay" px-3 py-1.5 (to hơn, vẫn ghost accent)', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    await user.click(screen.getByRole('button', { name: /Chọn ngày|Hôm nay/ }));
    const btn = screen.getByText('Hôm nay');
    expect(btn).toHaveClass('px-3', 'py-1.5');
  });
});

describe('DatePicker — responsive 375 (bugfix PO: popover tràn viewport / che trigger)', () => {
  const NOW = new Date(2026, 9, 15);

  function setViewport(w: number, h: number) {
    Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
  }
  function mockTriggerRect(rect: { left: number; top: number; right: number; bottom: number }) {
    return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: rect.left,
      y: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
      ...rect,
      toJSON: () => rect,
    } as DOMRect);
  }
  function positionedWrapper(): HTMLElement {
    // panel min-w nằm trong wrapper định vị (left/top/bottom inline style)
    const panel = document.body.querySelector('[class*="min-w-[300px]"]') as HTMLElement;
    expect(panel).not.toBeNull();
    return panel.parentElement!;
  }

  it('viewport 375 + trigger sát phải → cạnh phải panel bị clamp vào trong viewport (margin 8)', async () => {
    setViewport(375, 667);
    const spy = mockTriggerRect({ left: 300, top: 168, right: 340, bottom: 200 });
    const user = userEvent.setup();
    render(<DatePicker now={NOW} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    // panel chưa đo được (jsdom 0) → fallback min-w 300: left = 375 − 8 − 300 = 67
    expect(parseFloat(positionedWrapper().style.left)).toBe(67);
    spy.mockRestore();
  });

  it('trigger ở trái → giữ bottom-start (left = rect.left), không clamp ngược', async () => {
    setViewport(375, 667);
    const spy = mockTriggerRect({ left: 40, top: 168, right: 220, bottom: 200 });
    const user = userEvent.setup();
    render(<DatePicker now={NOW} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    expect(parseFloat(positionedWrapper().style.left)).toBe(40);
    spy.mockRestore();
  });

  it('trigger sát đáy viewport → panel flip lên trên (bottom thay top — không che trigger)', async () => {
    setViewport(375, 667);
    const spy = mockTriggerRect({ left: 40, top: 500, right: 220, bottom: 532 });
    const user = userEvent.setup();
    render(<DatePicker now={NOW} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    const pos = positionedWrapper().style;
    expect(pos.bottom).toBe('171px'); // innerHeight − rect.top + 4 = 667 − 500 + 4
    expect(pos.top).toBe('');
    spy.mockRestore();
  });

  it('panel max-w-[calc(100vw-16px)] + showTime flex-wrap + cột giờ min-w-0 (co được ở 375)', async () => {
    setViewport(375, 667);
    const spy = mockTriggerRect({ left: 8, top: 100, right: 200, bottom: 132 });
    const user = userEvent.setup();
    render(<DatePicker showTime now={NOW} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    const panel = document.body.querySelector('[class*="min-w-[300px]"]') as HTMLElement;
    expect(panel.className).toContain('max-w-[calc(100vw-16px)]');
    const row = panel.querySelector('[class*="flex-wrap"]');
    expect(row).not.toBeNull();
    const timeCol = screen.getByLabelText('Tăng giờ').closest('[class*="min-w-0"]');
    expect(timeCol).not.toBeNull();
    spy.mockRestore();
  });
});
