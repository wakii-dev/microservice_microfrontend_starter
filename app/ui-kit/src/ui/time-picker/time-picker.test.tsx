import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimePicker } from './index.js';
afterEach(cleanup);

const NOW = new Date(2026, 9, 15, 14, 25); // 15/10/2026 14:25

describe('TimePicker (batch ⑧ worker C)', () => {
  it('value string "08:30" → trigger hiển thị HH:mm; mở panel có stepper Giờ/Phút', async () => {
    const user = userEvent.setup();
    render(<TimePicker value="08:30" />);
    expect(screen.getByLabelText('Giờ: 08:30')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Giờ: 08:30'));
    expect(screen.getByText('Giờ')).toBeInTheDocument();
    expect(screen.getByText('Phút')).toBeInTheDocument();
    expect(screen.getByText('08')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('placeholder khi không value', () => {
    render(<TimePicker />);
    expect(screen.getByText('HH:mm')).toBeInTheDocument();
    expect(screen.getByLabelText('Chọn giờ')).toBeInTheDocument();
  });

  it('value Date → chọn giờ qua stepper đổi value, GIỮ phần ngày', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TimePicker value={new Date(2026, 9, 15, 8, 30)} now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Giờ: 08:30'));
    fireEvent.click(screen.getByLabelText('Tăng giờ')); // 08 → 09
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15, 9, 30));
    fireEvent.click(screen.getByLabelText('Giảm phút')); // 30 → 29
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 9, 15, 8, 29));
  });

  it('nút "Bây giờ" → onChange theo now + đóng panel', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TimePicker value="08:30" now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Giờ: 08:30'));
    fireEvent.click(screen.getByText('Bây giờ'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15, 14, 25));
    expect(screen.queryByText('Bây giờ')).not.toBeInTheDocument();
  });

  it('value string → ngày phát ra là mốc thuần (01/01/1970)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TimePicker value="00:05" now={NOW} onChange={onChange} />);
    await user.click(screen.getByLabelText('Giờ: 00:05'));
    fireEvent.click(screen.getByLabelText('Giảm giờ')); // 00 → 23 (wrap)
    expect(onChange).toHaveBeenCalledWith(new Date(1970, 0, 1, 23, 5));
  });

  it('locale="en" → nút nhanh "Now", aria tăng/giảm tiếng Anh', async () => {
    const user = userEvent.setup();
    render(<TimePicker locale="en" now={NOW} />);
    await user.click(screen.getByLabelText('Pick time'));
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase hour')).toBeInTheDocument();
  });
});

describe('TimePicker — classNames slots + style (slots wave 3)', () => {
  const NOW = new Date(2026, 9, 15, 14, 25);

  it('slots lên đúng element: root (span wrapper) / trigger (button) / panel (portal)', async () => {
    const user = userEvent.setup();
    render(
      <TimePicker
        value="08:30"
        now={NOW}
        classNames={{ root: 'slot-root', trigger: 'slot-trigger', panel: 'slot-panel' }}
      />,
    );
    const root = screen.getByLabelText('Giờ: 08:30').closest('.relative')!;
    expect(root).toHaveClass('slot-root');
    expect(screen.getByLabelText('Giờ: 08:30')).toHaveClass('slot-trigger');
    await user.click(screen.getByLabelText('Giờ: 08:30'));
    const panel = document.body.querySelector('[class*="w-[180px]"]')!;
    expect(panel).toHaveClass('slot-panel');
  });

  it('style passthrough lên root + không truyền slots → stepper vẫn onChange (behavior giữ nguyên)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TimePicker value={new Date(2026, 9, 15, 8, 30)} now={NOW} onChange={onChange} style={{ margin: '8px' }} className="user-last" />,
    );
    const root = screen.getByLabelText('Giờ: 08:30').closest('.relative') as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThan(root.className.indexOf('inline-flex'));
    await user.click(screen.getByLabelText('Giờ: 08:30'));
    fireEvent.click(screen.getByLabelText('Tăng giờ'));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 15, 9, 30));
  });
});
