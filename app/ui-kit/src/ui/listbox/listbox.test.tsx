import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Listbox } from './index.js';
afterEach(cleanup);

const OPTIONS = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b', disabled: true },
];

describe('Listbox', () => {
  it('role=listbox + options; click → onChange; disabled → không', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Listbox options={OPTIONS} value="a" onChange={onChange} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toHaveClass('font-semibold');
    await user.click(screen.getByText('Option B'));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

// ── Coverage audit additions ─────────────────────────────────────────────────────
describe('Listbox — coverage audit', () => {
  it('aria-selected trên option; chọn option khác → onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Listbox options={OPTIONS} value="a" onChange={onChange} />);
    expect(screen.getByRole('option', { name: 'Option A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Option B' })).toHaveAttribute('aria-selected', 'false');
    await user.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('disabled option → style khoá (cursor-not-allowed) + không chọn được (kể cả click nhiều lần)', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Listbox options={OPTIONS} value="a" onChange={onChange} />);
    const disabled = screen.getByRole('option', { name: 'Option B' });
    // NOTE: component chưa render aria-disabled (a11y gap — chỉ signal bằng style)
    expect(disabled.className).toContain('cursor-not-allowed');
    await user.click(disabled);
    await user.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });
});
