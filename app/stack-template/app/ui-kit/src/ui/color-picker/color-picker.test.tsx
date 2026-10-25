import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorPicker } from './index.js';
afterEach(cleanup);

describe('ColorPicker', () => {
  it('swatch button mở palette; preset click → onChange', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1677ff" onChange={onChange} />);
    await userEvent.setup().click(screen.getByLabelText('Chọn màu'));
    await userEvent.setup().click(screen.getByLabelText('#f5222d'));
    expect(onChange).toHaveBeenCalledWith('#f5222d');
  });
  it('native color input + hex display (mở palette)', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#1677ff" onChange={vi.fn()} />);
    await user.click(screen.getByLabelText('Chọn màu'));
    const colorInput = document.querySelector('input[type="color"]');
    expect(colorInput).not.toBeNull();
  });
});

describe('ColorPicker — matrix (props thật: value/onChange/presets/className)', () => {
  it('uncontrolled — không value → default #1677ff hiển thị trên swatch', () => {
    render(<ColorPicker onChange={vi.fn()} />);
    expect(screen.getByLabelText('Chọn màu')).toHaveStyle({ background: '#1677ff' });
  });

  it('native input[type=color] đổi → onChange nhận giá trị', async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1677ff" onChange={onChange} />);
    await userEvent.setup().click(screen.getByLabelText('Chọn màu'));
    fireEvent.change(document.querySelector('input[type="color"]')!, { target: { value: '#123456' } });
    expect(onChange).toHaveBeenCalledWith('#123456');
  });

  it('hex text input đổi → onChange nhận chuỗi gõ', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ColorPicker value="#1677ff" onChange={onChange} />);
    await user.click(screen.getByLabelText('Chọn màu'));
    // controlled input (value từ prop, không setState trong test) → fireEvent.change 1 phát
    fireEvent.change(screen.getByLabelText('Custom color').parentElement!.querySelector('input[type="text"]')!, { target: { value: '#abc' } });
    expect(onChange).toHaveBeenLastCalledWith('#abc');
  });

  it('presets custom render đúng danh sách; empty → không preset nào', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ColorPicker value="#1677ff" presets={['#111111', '#222222']} />);
    await user.click(screen.getByLabelText('Chọn màu'));
    expect(screen.getByLabelText('#111111')).toBeInTheDocument();
    expect(screen.getByLabelText('#222222')).toBeInTheDocument();
    rerender(<ColorPicker value="#1677ff" presets={[]} />);
    expect(screen.queryByLabelText('#111111')).toBeNull();
  });

  it('bấm trigger lần nữa → palette đóng (toggle); className passthrough', async () => {
    const user = userEvent.setup();
    const { container } = render(<ColorPicker value="#1677ff" className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
    const trigger = screen.getByLabelText('Chọn màu');
    await user.click(trigger);
    expect(document.querySelector('input[type="color"]')).not.toBeNull();
    await user.click(trigger);
    expect(document.querySelector('input[type="color"]')).toBeNull();
  });
});
