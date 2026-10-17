// Switch tests — toggle, role=switch, aria-checked, size, children, disabled.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Switch } from './index.js';

afterEach(cleanup);

describe('Switch', () => {
  it('role=switch + aria-checked; click toggle onChange', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} aria-label="Bật" />);
    const sw = screen.getByRole('switch', { name: 'Bật' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.setup().click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('checked hiển thị children checked', () => {
    render(<Switch checked checkedChildren="Bật" unCheckedChildren="Tắt" />);
    expect(screen.getByText('Bật')).toBeInTheDocument();
  });

  it('size small + disabled', () => {
    render(<Switch size="small" disabled onChange={vi.fn()} aria-label="s" />);
    expect(screen.getByRole('switch', { name: 's' })).toBeDisabled();
  });
});
