import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from './index.js';
afterEach(cleanup);
describe('DatePicker', () => {
  it('click trigger → calendar mở; chọn ngày → onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DatePicker onChange={onChange} />);
    await user.click(screen.getByLabelText('Chọn ngày'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    fireEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalled();
  });
  it('placeholder khi không value', () => {
    render(<DatePicker placeholder="Chọn ngày…" />);
    expect(screen.getByText('Chọn ngày…')).toBeInTheDocument();
  });
});
