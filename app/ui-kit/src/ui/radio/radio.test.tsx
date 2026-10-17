// Radio/Group tests — chọn 1 trong nhóm, disabled per-option.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Radio, RadioGroup } from './index.js';

afterEach(cleanup);

describe('RadioGroup', () => {
  it('value hiện tại checked; chọn option khác → onChange(value)', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        value="a"
        onChange={onChange}
        options={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ]}
      />,
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('option disabled → không chọn được', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        value="a"
        onChange={onChange}
        options={[
          { label: 'A', value: 'a' },
          { label: 'Khoá', value: 'k', disabled: true },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByText('Khoá'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Radio đơn — onChange(checked)', async () => {
    const onChange = vi.fn();
    render(<Radio checked={false} onChange={onChange}>r</Radio>);
    await userEvent.setup().click(screen.getByText('r'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
