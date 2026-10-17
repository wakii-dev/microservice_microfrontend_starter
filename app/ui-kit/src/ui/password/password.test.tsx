import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Password } from './index.js';
afterEach(cleanup);
describe('Password', () => {
  it('type password mặc định; toggle → text', () => {
    const { rerender } = render(<Password ariaLabel="pw" value="secret" />);
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText('Hiện mật khẩu'));
    rerender(<Password ariaLabel="pw" value="secret" />);
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'text');
  });
  it('showStrength → strength bars', () => {
    render(<Password ariaLabel="pw" value="Strong1!" showStrength />);
    expect(screen.getByText('Mạnh')).toBeInTheDocument();
  });
});
