import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rating } from './index.js';
afterEach(cleanup);
describe('Rating', () => {
  it('max stars render; click → onChange', async () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: '3 sao' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });
  it('readonly → không click được', async () => {
    const onChange = vi.fn();
    render(<Rating readOnly onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('button', { name: '1 sao' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
