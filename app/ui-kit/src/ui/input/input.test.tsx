// Input/Textarea tests — antd look: border line, focus ring accent, invalid đỏ.
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input, Textarea } from './index.js';
import { computeAutoSizeHeight, resolveAutoSize } from './autosize.js';

afterEach(cleanup);

describe('Input', () => {
  it('render input + onChange nhận giá trị gõ', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Tiêu đề" onChange={onChange} />);
    await userEvent.setup().type(screen.getByLabelText('Tiêu đề'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('invalid → class viền đỏ (error state)', () => {
    render(<Input aria-label="Email" invalid />);
    expect(screen.getByLabelText('Email').className).toContain('border-st-fail');
  });

  it('passthrough value + placeholder + disabled', () => {
    render(<Input aria-label="T" value="giữ draft" placeholder="nhập…" disabled readOnly />);
    const el = screen.getByLabelText('T') as HTMLInputElement;
    expect(el.value).toBe('giữ draft');
    expect(el).toHaveAttribute("placeholder", "nhập…");
    expect(el).toBeDisabled();
  });

  it('className passthrough', () => {
    render(<Input aria-label="W" className="flex-1" />);
    expect(screen.getByLabelText('W')).toHaveClass('flex-1');
  });
});

describe('Textarea', () => {
  it('render textarea + gõ được', async () => {
    render(<Textarea aria-label="Mô tả" />);
    await userEvent.setup().type(screen.getByLabelText('Mô tả'), 'mô tả ngắn');
    expect(screen.getByLabelText('Mô tả')).toHaveValue('mô tả ngắn');
  });

  it('invalid → viền đỏ', () => {
    render(<Textarea aria-label="D" invalid />);
    expect(screen.getByLabelText('D').className).toContain('border-st-fail');
  });
});

describe('Input — affix + allowClear (Tier 1.5)', () => {
  it('prefix/suffix → affix wrapper; input trần bên trong', () => {
    render(<Input aria-label="Giá" prefix="https://" suffix=".vn" value="wakii" readOnly />);
    const el = screen.getByLabelText('Giá');
    expect(el.closest('span')).toHaveClass('inline-flex');
    expect(screen.getByText('https://')).toBeInTheDocument();
    expect(screen.getByText('.vn')).toBeInTheDocument();
  });

  it('allowClear controlled — có value → nút ×; click → onChange được gọi', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Tìm" allowClear value="giá trị" onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Xoá' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('size small → class h-6', () => {
    render(<Input aria-label="S" size="small" />);
    expect(screen.getByLabelText('S')).toHaveClass('h-6');
  });
});

describe('Input — branch phụ (Tier 1.5)', () => {
  it('allowClear + value rỗng → KHÔNG nút × (showClear false)', () => {
    render(<Input aria-label="Q" allowClear value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
  });

  it('prefix-only (không suffix/clear) → vẫn affix wrapper', () => {
    render(<Input aria-label="P" prefix="$" value="1" readOnly />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });
});

describe('Input — branch phụ (Tier 1.5)', () => {
  it('size large → h-10; affix + invalid → wrapper ring đỏ', () => {
    render(<Input aria-label="L" size="large" invalid prefix="$" value="5" readOnly />);
    const el = screen.getByLabelText('L');
    expect(el).toHaveClass('h-10');
    expect(el.closest('span')).toHaveClass('border-st-fail');
  });
});

describe('Textarea — showCount (Tier 1.5)', () => {
  it('showCount + maxLength → đếm ký tự', () => {
    render(<Textarea aria-label="Đếm" showCount maxLength={10} value="abc" readOnly />);
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });
});

describe('Input — branch phụ (Tier 5 sweep)', () => {
  it('allowClear + value rỗng → không ×; suffix-only → affix', () => {
    const { rerender } = render(<Input aria-label="c" allowClear value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
    rerender(<Input aria-label="s" suffix="kg" value="5" readOnly />);
    expect(screen.getByText('kg')).toBeInTheDocument();
  });
});

describe('Input — classNames slots + style (SÓNG-3)', () => {
  it('slots lên đúng element: root→wrapper affix, input→input, prefix/suffix→span', () => {
    render(
      <Input
        aria-label="Slot"
        prefix="$"
        suffix="kg"
        value="5"
        readOnly
        classNames={{ root: 'slot-root', input: 'slot-input', prefix: 'slot-prefix', suffix: 'slot-suffix' }}
      />,
    );
    const el = screen.getByLabelText('Slot');
    expect(el).toHaveClass('slot-input');
    expect(el).not.toHaveClass('slot-root'); // root → wrapper, không dính input
    expect(el.closest('span')).toHaveClass('slot-root');
    expect(screen.getByText('$')).toHaveClass('slot-prefix');
    expect(screen.getByText('kg')).toHaveClass('slot-suffix');
  });

  it('style passthrough + tương tác chạy; standalone: root slot trước className người dùng', async () => {
    const onChange = vi.fn();
    render(
      <Input
        aria-label="Style"
        style={{ background: 'rgb(1, 2, 3)' }}
        classNames={{ root: 'slot-root' }}
        className="user-last"
        onChange={onChange}
      />,
    );
    const el = screen.getByLabelText('Style');
    expect(el).toHaveStyle({ background: 'rgb(1, 2, 3)' });
    expect(el).toHaveClass('slot-root');
    // className người dùng vẫn cuối cùng (append sau root slot)
    expect(el.className.indexOf('slot-root')).toBeLessThan(el.className.indexOf('user-last'));
    await userEvent.setup().type(el, 'x');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('Textarea — classNames slots + style (SÓNG-3)', () => {
  it('slots lên đúng element: root→wrapper, textarea→element, count→dòng đếm', () => {
    render(
      <Textarea
        aria-label="Slots"
        value="abcdef"
        maxLength={10}
        showCount
        readOnly
        classNames={{ root: 'slot-root', textarea: 'slot-textarea', count: 'slot-count' }}
      />,
    );
    const el = screen.getByLabelText('Slots');
    expect(el).toHaveClass('slot-textarea');
    expect(el).not.toHaveClass('slot-root'); // root → wrapper, không dính textarea
    expect(el.closest('div')).toHaveClass('slot-root');
    expect(screen.getByText('6/10')).toHaveClass('slot-count');
  });

  it('style passthrough + gõ vẫn chạy; textarea slot trước className người dùng', async () => {
    const onChange = vi.fn();
    render(
      <Textarea
        aria-label="Style"
        style={{ color: 'rgb(9, 9, 9)' }}
        classNames={{ textarea: 'slot-textarea' }}
        className="user-last"
        onChange={onChange}
      />,
    );
    const el = screen.getByLabelText('Style');
    expect(el).toHaveStyle({ color: 'rgb(9, 9, 9)' });
    expect(el.className.indexOf('slot-textarea')).toBeLessThan(el.className.indexOf('user-last'));
    await userEvent.setup().type(el, 'ok');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

// --- autoSize (pure math) ---
describe('resolveAutoSize', () => {
  it('true → {minRows: 2} (unbounded)', () => {
    expect(resolveAutoSize(true)).toEqual({ minRows: 2 });
  });
  it('object passes through', () => {
    expect(resolveAutoSize({ minRows: 3, maxRows: 6 })).toEqual({ minRows: 3, maxRows: 6 });
  });
});

describe('computeAutoSizeHeight', () => {
  const base = { lineHeight: 22, paddingY: 24, scrollHeight: 0 };
  it('grows to natural rows (ceil), respects minRows floor', () => {
    expect(computeAutoSizeHeight({ ...base, scrollHeight: 200, minRows: 3 }))
      .toEqual({ height: 8 * 22 + 24, overflowY: 'hidden' });
  });
  it('empty content floors at minRows', () => {
    expect(computeAutoSizeHeight({ ...base, scrollHeight: 10, minRows: 3 }).height).toBe(3 * 22 + 24);
  });
  it('clamps at maxRows + overflowY auto', () => {
    expect(computeAutoSizeHeight({ ...base, scrollHeight: 500, maxRows: 4 }))
      .toEqual({ height: 4 * 22 + 24, overflowY: 'auto' });
  });
  it('lineHeight<=0 falls back to 22 (jsdom)', () => {
    expect(computeAutoSizeHeight({ ...base, lineHeight: 0, scrollHeight: 46, minRows: 2 }).height).toBe(2 * 22 + 24);
  });
});

// --- autoSize (DOM wiring) ---
/** Stateful harness — controlled Textarea like a real form. */
function TextareaHarness(props: { autoSize?: boolean | { minRows?: number; maxRows?: number }; maxRowsCase?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <Textarea
      autoSize={props.autoSize}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      maxLength={props.maxRowsCase ? 400 : undefined}
      showCount={props.maxRowsCase}
    />
  );
}

function stubMetrics(ta: HTMLTextAreaElement, scrollHeight: number) {
  Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  return vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    lineHeight: '22px', paddingTop: '12px', paddingBottom: '12px',
  } as CSSStyleDeclaration);
}

describe('Textarea autoSize', () => {
  it('controlled: typing grows to clamp then shrinks to floor', () => {
    const { container } = render(<TextareaHarness autoSize={{ minRows: 2, maxRows: 4 }} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    let scroll = 500;
    Object.defineProperty(ta, 'scrollHeight', { configurable: true, get: () => scroll }); // mutable getter
    const cs = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '22px', paddingTop: '12px', paddingBottom: '12px',
    } as CSSStyleDeclaration);
    fireEvent.change(ta, { target: { value: 'line\n'.repeat(30) } }); // state → rerender → effect
    expect(ta.style.height).toBe(`${4 * 22 + 24}px`); // clamped at maxRows 4
    expect(ta.style.overflowY).toBe('auto');
    scroll = 46;
    fireEvent.change(ta, { target: { value: 'ab' } });
    expect(ta.style.height).toBe(`${2 * 22 + 24}px`); // floor minRows 2
    expect(ta.style.overflowY).toBe('hidden');
    cs.mockRestore();
  });

  it('uncontrolled: onChange path measures without any re-render', () => {
    const { container } = render(<Textarea autoSize={{ minRows: 2, maxRows: 4 }} defaultValue="" />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    const cs = stubMetrics(ta, 500);
    fireEvent.change(ta, { target: { value: 'line\n'.repeat(30) } }); // no state anywhere
    expect(ta.style.height).toBe(`${4 * 22 + 24}px`);
    cs.mockRestore();
  });

  it('autoSize wins over the rows attribute', () => {
    const { container } = render(<Textarea autoSize rows={5} defaultValue="y" />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    const cs = stubMetrics(ta, 46);
    fireEvent.change(ta, { target: { value: 'x' } }); // real value change — React swallows same-value change events
    expect(ta.style.height).toBe(`${2 * 22 + 24}px`); // minRows 2, rows={5} ignored
    expect(ta).toHaveAttribute('rows', '5'); // attribute still passed through, height governed by autoSize
    cs.mockRestore();
  });

  it('coexists with showCount + maxLength', () => {
    const { container } = render(<TextareaHarness autoSize maxRowsCase />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    const cs = stubMetrics(ta, 68);
    fireEvent.change(ta, { target: { value: 'abc' } });
    // scroll 68 → content 44 → 2 rows → minRows 2 → 2*22+24 = 68px
    expect(ta.style.height).toBe(`${2 * 22 + 24}px`);
    expect(screen.getByText('3/400')).toBeInTheDocument();
    cs.mockRestore();
  });

  it('no autoSize → height untouched (default path identical)', () => {
    const { container } = render(<Textarea value="x" onChange={() => {}} rows={3} />);
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(ta.style.height).toBe('');
    expect(ta).toHaveAttribute('rows', '3');
  });
});
