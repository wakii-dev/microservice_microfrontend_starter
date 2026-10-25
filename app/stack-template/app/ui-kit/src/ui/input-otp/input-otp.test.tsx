import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputOTP } from './index.js';
afterEach(cleanup);

describe('InputOTP', () => {
  it('renders N inputs; type digit → auto-focus next', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<InputOTP length={4} onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/Mã OTP/);
    expect(inputs.length).toBe(4);
    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();
  });
  it('paste → fill multiple', () => {
    const onChange = vi.fn();
    render(<InputOTP length={4} onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/Mã OTP/);
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => '1234' } });
    expect(onChange).toHaveBeenCalledWith('1234');
  });
});

describe('InputOTP — matrix (length/paste/backspace/disabled/a11y)', () => {
  it('backspace ở ô rỗng → focus lùi ô trước', async () => {
    const user = userEvent.setup();
    render(<InputOTP length={4} ariaLabel="OTP code" onChange={vi.fn()} />);
    const inputs = screen.getAllByLabelText(/OTP code/);
    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();
    await user.type(inputs[1], '{backspace}');
    expect(inputs[0]).toHaveFocus();
  });

  it('ký tự không phải số bị strip (chỉ digit vào ô)', async () => {
    const onChange = vi.fn();
    render(<InputOTP length={4} ariaLabel="OTP code" onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/OTP code/);
    fireEvent.change(inputs[0], { target: { value: 'a9' } });
    expect(inputs[0]).toHaveValue('9');
    expect(onChange).toHaveBeenCalledWith('9');
  });

  it('paste dài hơn length → cắt đúng length', () => {
    const onChange = vi.fn();
    render(<InputOTP length={4} ariaLabel="OTP code" onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/OTP code/);
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
    expect(onChange).toHaveBeenCalledWith('1234');
  });

  it('disabled → mọi ô khoá', () => {
    render(<InputOTP length={3} disabled ariaLabel="OTP code" />);
    for (const input of screen.getAllByLabelText(/OTP code/)) expect(input).toBeDisabled();
  });

  it('controlled — value prop chia vào từng ô', () => {
    render(<InputOTP length={4} value="12" ariaLabel="OTP code" />);
    const inputs = screen.getAllByLabelText(/OTP code/);
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('');
  });
});
