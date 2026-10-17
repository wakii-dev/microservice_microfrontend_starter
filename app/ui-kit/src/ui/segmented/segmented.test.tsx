// Segmented tests — radiogroup + active + onChange.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Segmented } from './index.js';

afterEach(cleanup);

const OPTIONS = [
  { label: 'Ngày', value: 'day' },
  { label: 'Tuần', value: 'week' },
];

describe('Segmented', () => {
  it('radiogroup + active = value; click → onChange', async () => {
    const onChange = vi.fn();
    render(<Segmented options={OPTIONS} value="day" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Ngày' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.setup().click(screen.getByRole('radio', { name: 'Tuần' }));
    expect(onChange).toHaveBeenCalledWith('week');
  });
});
