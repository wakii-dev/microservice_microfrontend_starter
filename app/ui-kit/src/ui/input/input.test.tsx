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
