import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToggleButton } from './index.js';
afterEach(cleanup);
describe('ToggleButton', () => {
  it('aria-pressed + click → onChange(!checked)', async () => {
    const onChange = vi.fn();
    render(<ToggleButton checked={false} onChange={onChange}>Toggle</ToggleButton>);
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Toggle' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
