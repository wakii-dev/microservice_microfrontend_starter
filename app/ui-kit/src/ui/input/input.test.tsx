// Input/Textarea tests — antd look: border line, focus ring accent, invalid đỏ.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input, Textarea } from './index';

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
