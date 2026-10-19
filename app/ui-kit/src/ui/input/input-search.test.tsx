// Input.Search tests — hành vi antd: Enter/click → onSearch(text), enterButton
// đổi variant nút, loading chặn search tiếp, disabled chặn cả hai, invalid đỏ.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from './index.js';

afterEach(cleanup);

describe('Input.Search', () => {
  it('render input + nút Search icon-only; gõ + Enter → onSearch nhận giá trị', async () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="Tìm task" onSearch={onSearch} />);
    const input = screen.getByLabelText('Tìm task');
    expect(input.tagName).toBe('INPUT');
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.querySelector('svg')).not.toBeNull(); // icon-only mặc định
    await userEvent.setup().type(input, 'bug{Enter}');
    expect(onSearch).toHaveBeenCalledWith('bug');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('click nút → onSearch với giá trị uncontrolled hiện tại', async () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="Q" onSearch={onSearch} />);
    await userEvent.setup().type(screen.getByLabelText('Q'), 'filter');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalledWith('filter');
  });

  it('controlled value → onSearch dùng value prop (không dùng state trong)', () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="C" value="fixed" onChange={vi.fn()} onSearch={onSearch} />);
    // click trực tiếp (không gõ) — payload phải là value controlled
    screen.getByRole('button', { name: 'Search' }).click();
    expect(onSearch).toHaveBeenCalledWith('fixed');
  });

  it('enterButton=true → nút primary bg-accent vẫn fire onSearch', async () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="E" enterButton onSearch={onSearch} />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.className).toContain('bg-accent');
    await userEvent.setup().click(btn);
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('enterButton=ReactNode → render nội dung nút, name từ content (không aria-label cứng)', async () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="N" enterButton="Tìm kiếm" onSearch={onSearch} />);
    const btn = screen.getByRole('button', { name: 'Tìm kiếm' });
    expect(btn).not.toHaveAttribute('aria-label');
    await userEvent.setup().click(btn);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('loading → Spinner thay icon + Enter/click KHÔNG fire thêm', async () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="L" loading onSearch={onSearch} />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.querySelector('svg')).toBeNull(); // icon search thay bằng Spinner
    await userEvent.setup().click(btn);
    await userEvent.setup().type(screen.getByLabelText('L'), '{Enter}');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('disabled → input + nút disabled, click không fire', async () => {
    const onSearch = vi.fn();
    render(<Input.Search aria-label="D" disabled onSearch={onSearch} />);
    expect(screen.getByLabelText('D')).toBeDisabled();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('invalid → wrapper viền đỏ; size large → h-10; passthrough placeholder', () => {
    render(<Input.Search aria-label="I" invalid size="large" placeholder="lọc…" />);
    const input = screen.getByLabelText('I');
    expect(input.closest('span')!.className).toContain('border-st-fail');
    expect(input).toHaveAttribute('placeholder', 'lọc…');
    expect(input.closest('span')!.className).toContain('h-10');
  });
});

describe('InputSearch — redo antd-fidelity (allowClear + attached flush)', () => {
  it('allowClear: ẩn khi rỗng; có text → hiện ×; click → onChange("") + KHÔNG fire onSearch', async () => {
    const onSearch = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Input.Search allowClear onChange={onChange} onSearch={onSearch} />);
    expect(screen.queryByLabelText('Xoá nội dung tìm kiếm')).toBeNull();
    const input = container.querySelector('input')!;
    await user.type(input, 'abc');
    const clear = screen.getByLabelText('Xoá nội dung tìm kiếm');
    await user.click(clear);
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ target: { value: '' } }));
    expect(onSearch).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.queryByLabelText('Xoá nội dung tìm kiếm')).toBeNull();
  });

  it('nút search DÍNH THÀNH THỂ (guard): wrapper overflow-hidden bo góc, nút KHÔNG radius riêng — chỉ border-l phân tách', () => {
    const wrapper = render(<Input.Search />).container.querySelector('span')!;
    expect(wrapper.className).toContain('overflow-hidden');
    expect(wrapper.className).toContain('rounded-lg');
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.className).not.toMatch(/rounded/); // góc do wrapper clip — flush tuyệt đối
    expect(btn.className).toContain('border-l'); // hairline phân tách với input
  });

  it('press = chìm 1px (active:translate-y-px) — không scale (depth contract)', () => {
    render(<Input.Search />);
    const btn = screen.getByRole('button', { name: 'Search' });
    expect(btn.className).toContain('active:translate-y-px');
    expect(btn.className).not.toContain('scale');
  });
});
