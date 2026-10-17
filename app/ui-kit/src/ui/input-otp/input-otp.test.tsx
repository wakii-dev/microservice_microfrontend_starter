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
