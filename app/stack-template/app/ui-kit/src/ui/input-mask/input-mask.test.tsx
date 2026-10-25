import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputMask } from './index.js';
afterEach(cleanup);

describe('InputMask', () => {
  it('mask 999-999: digits fill + dash literal', () => {
    const onChange = vi.fn();
    render(<InputMask mask="999-999" ariaLabel="phone" onChange={onChange} />);
    const input = screen.getByLabelText('phone');
    fireEvent.change(input, { target: { value: '123456' } });
    expect(input).toHaveValue('123-456');
    expect(onChange).toHaveBeenCalledWith('123-456');
  });
  it('mask aa-99: letters + digits', () => {
    const onChange = vi.fn();
    render(<InputMask mask="aa-99" ariaLabel="code" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('code'), { target: { value: 'AB12' } });
    expect(screen.getByLabelText('code')).toHaveValue('AB-12');
  });
});

describe('InputMask — matrix (props thật: mask/value/onChange/ariaLabel + rest)', () => {
  it('dừng ở ký tự không hợp lệ (digit mask nhận chữ → cắt tại đó)', () => {
    const onChange = vi.fn();
    render(<InputMask mask="999-999" ariaLabel="p" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('p'), { target: { value: '12a456' } });
    expect(screen.getByLabelText('p')).toHaveValue('12');
    expect(onChange).toHaveBeenLastCalledWith('12');
  });

  it('controlled — value prop điều khiển hiển thị', () => {
    const { rerender } = render(<InputMask mask="99-99" ariaLabel="c" value="12-34" />);
    expect(screen.getByLabelText('c')).toHaveValue('12-34');
    rerender(<InputMask mask="99-99" ariaLabel="c" value="56-78" />);
    expect(screen.getByLabelText('c')).toHaveValue('56-78');
  });

  it('uncontrolled — không value → gõ qua state nội bộ', () => {
    render(<InputMask mask="9-9" ariaLabel="u" />);
    fireEvent.change(screen.getByLabelText('u'), { target: { value: '78' } });
    expect(screen.getByLabelText('u')).toHaveValue('7-8');
  });

  it('rest props passthrough: placeholder + disabled', () => {
    render(<InputMask mask="999" ariaLabel="d" placeholder="123" disabled />);
    const input = screen.getByLabelText('d');
    expect(input).toHaveAttribute('placeholder', '123');
    expect(input).toBeDisabled();
  });

  it('a11y — aria-label là accessible name; className passthrough', () => {
    const { container } = render(<InputMask mask="9" ariaLabel="Số lượng" className="marker" />);
    expect(screen.getByLabelText('Số lượng')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('marker');
  });
});
