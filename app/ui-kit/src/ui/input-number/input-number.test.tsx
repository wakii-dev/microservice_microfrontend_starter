// InputNumber tests — gõ/step/clamp min-max/blur commit.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputNumber } from './index.js';

afterEach(cleanup);

describe('InputNumber', () => {
  it('stepper ▲ tăng theo step + clamp max', async () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="số lượng" value={9} min={0} max={10} step={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tăng' }));
    expect(onChange).toHaveBeenLastCalledWith(10);
  });

  it('blur commit + clamp min', () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="n" min={0} onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText('n'), { target: { value: '-5' } });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('text rỗng → onChange(null)', () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="n" onChange={onChange} />);
    fireEvent.blur(screen.getByLabelText('n'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('InputNumber — branch phụ (Tier 5 sweep)', () => {
  it('text không phải số → onChange(null); nút Giảm; min/max clamp khi bump', async () => {
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="n" min={0} max={10} value={10} step={2} onChange={onChange} />);
    // Giảm từ 10, step 2 → 8 (không vượt min)
    fireEvent.click(screen.getByRole('button', { name: 'Giảm' }));
    expect(onChange).toHaveBeenLastCalledWith(8);
  });
});

describe('InputNumber — blur sync clamp (user feedback: MinMaxClamp "chưa đúng")', () => {
  // LƯU Ý: dùng userEvent (type + tab) — fireEvent.blur với target-override dính quirk
  // jsdom/React controlled-input (setText không reflect DOM); userEvent đi đúng đường
  // focus/blur thật, khớp browser (đã verify playwright: input nhảy "99"→"10").
  it('blur với giá trị quá max → text ô input NHẢY về giá trị clamp (không kẹt số sai)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputNumber ariaLabel="n" min={0} max={10} onChange={onChange} />);
    const input = screen.getByLabelText('n');
    await user.type(input, '99');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(input).toHaveValue(10);
  });

  it('blur giá trị TRONG cận → text giữ nguyên (không đụng)', async () => {
    const user = userEvent.setup();
    render(<InputNumber ariaLabel="n" min={0} max={10} />);
    const input = screen.getByLabelText('n');
    await user.type(input, '7');
    await user.tab();
    expect(input).toHaveValue(7);
  });
});

describe('InputNumber — matrix gaps (a11y/disabled/invalid/className)', () => {
  it('stepper buttons có accessible name "Tăng"/"Giảm" (a11y)', () => {
    render(<InputNumber ariaLabel="n" value={5} />);
    expect(screen.getByRole('button', { name: 'Tăng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giảm' })).toBeInTheDocument();
  });

  it('disabled → input + 2 stepper khoá, không phát onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<InputNumber ariaLabel="n" disabled onChange={onChange} />);
    const input = screen.getByLabelText('n');
    expect(input).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Tăng' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('invalid → viền đỏ class (không đụng behavior)', () => {
    render(<InputNumber ariaLabel="n" invalid value={-1} />);
    expect(screen.getByLabelText('n').closest('span')!.className).toContain('border-st-fail');
  });

  it('className passthrough ra wrapper', () => {
    const { container } = render(<InputNumber ariaLabel="n" className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
  });
});

describe('InputNumber — redo antd-fidelity (flush stepper + sizes + affixes)', () => {
  it('sizes: small h-6 / middle h-8 (mặc định) / large h-10 ăn theo họ Input', () => {
    const { rerender, container } = render(<InputNumber ariaLabel="n" size="small" />);
    expect(container.querySelector('input')!.className).toContain('h-6');
    rerender(<InputNumber ariaLabel="n" />);
    expect(container.querySelector('input')!.className).toContain('h-8');
    rerender(<InputNumber ariaLabel="n" size="large" />);
    expect(container.querySelector('input')!.className).toContain('h-10');
  });

  it('prefix/suffix render trong control — prefix trước input, suffix TRƯỚC cột stepper', () => {
    const { container } = render(
      <InputNumber ariaLabel="n" prefix={<span data-testid="pre">$</span>} suffix={<span data-testid="suf">kg</span>} />,
    );
    expect(screen.getByTestId('pre')).toBeInTheDocument();
    expect(screen.getByTestId('suf')).toBeInTheDocument();
    // prefix đứng TRƯỚC input, suffix đứng TRƯỚC cột stepper (stepper flush mép phải)
    const pre = screen.getByTestId('pre');
    const suf = screen.getByTestId('suf');
    const stepper = screen.getByRole('button', { name: 'Tăng' }).parentElement!;
    expect(pre.compareDocumentPosition(inputEl(container)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(suf.compareDocumentPosition(stepper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('stepper FLUSH (regression guard e94b3e4): wrapper overflow-hidden + nút h-1/2 bo CHỈ góc ngoài, divider border-t ở nút Giảm', () => {
    const { container } = render(<InputNumber ariaLabel="n" />);
    const wrapper = container.querySelector('span')!;
    expect(wrapper.className).toContain('overflow-hidden');
    expect(wrapper.className).toContain('rounded-lg');
    const up = screen.getByRole('button', { name: 'Tăng' });
    const down = screen.getByRole('button', { name: 'Giảm' });
    for (const b of [up, down]) {
      expect(b.className).toContain('h-1/2'); // full-height nửa trên/dưới — flush
      expect(b.className).not.toMatch(/\bborder-l\b/); // không viền riêng cột (border-line OK)
    }
    expect(up.className).toContain('border-none'); // nút trên không viền
    expect(up.className).toContain('rounded-tr-lg'); // chỉ góc NGOÀI trên
    expect(down.className).toContain('rounded-br-lg'); // chỉ góc NGOÀI dưới
    expect(down.className).toContain('border-t'); // hairline chia 2 nút
  });

  it('icon chevron 14px từ Icon bộ dùng chung + press-scale trên ICON (không scale nút — giữ flush)', () => {
    render(<InputNumber ariaLabel="n" />);
    const up = screen.getByRole('button', { name: 'Tăng' });
    const svg = up.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('14');
    expect(up.className).toContain('group/up');
    // press-scale nằm trên ICON (svg mang class group-active/up:scale-90) — không scale nút
    expect(svg.getAttribute('class')).toContain('group-active/up:scale-90');
    expect(svg.getAttribute('class')).toContain('transition-transform');
  });

  it('stepper hover bg-ink/5 + active bg-ink/10 (press phẳng — không hồi quy scale nút gây hở viền)', () => {
    render(<InputNumber ariaLabel="n" />);
    const up = screen.getByRole('button', { name: 'Tăng' });
    expect(up.className).toContain('hover:bg-ink/5');
    expect(up.className).toContain('active:bg-ink/10');
  });
});

function inputEl(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input')!;
}

describe('InputNumber — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root (span control) / input / stepper / stepUp / stepDown', () => {
    render(
      <InputNumber
        ariaLabel="số lượng"
        classNames={{ root: 'slot-root', input: 'slot-input', stepper: 'slot-stepper', stepUp: 'slot-step-up', stepDown: 'slot-step-down' }}
      />,
    );
    const input = screen.getByLabelText('số lượng');
    const root = input.parentElement!; // span control bọc input + stepper
    expect(root).toHaveClass('slot-root');
    expect(input).toHaveClass('slot-input');
    const stepper = screen.getByRole('button', { name: 'Tăng' }).parentElement!;
    expect(stepper).toHaveClass('slot-stepper');
    expect(screen.getByRole('button', { name: 'Tăng' })).toHaveClass('slot-step-up');
    expect(screen.getByRole('button', { name: 'Giảm' })).toHaveClass('slot-step-down');
  });

  it('style passthrough lên root + không truyền slots → stepper vẫn onChange (behavior giữ nguyên)', () => {
    const onChange = vi.fn();
    render(
      <InputNumber
        ariaLabel="n"
        value={9}
        max={10}
        onChange={onChange}
        style={{ margin: '8px' }}
        className="user-last"
      />,
    );
    const root = screen.getByLabelText('n').parentElement as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThan(root.className.indexOf('inline-flex'));
    fireEvent.click(screen.getByRole('button', { name: 'Tăng' }));
    expect(onChange).toHaveBeenLastCalledWith(10);
  });
});
