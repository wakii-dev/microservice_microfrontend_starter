// Checkbox tests — toggle/disabled/label-click.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox } from './index.js';

afterEach(cleanup);

describe('Checkbox', () => {
  it('click label → onChange(checked đảo)', async () => {
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Nhớ tôi</Checkbox>);
    await userEvent.setup().click(screen.getByText('Nhớ tôi'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('checked → input checked', () => {
    render(<Checkbox checked onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('disabled → không đổi', async () => {
    const onChange = vi.fn();
    render(<Checkbox disabled onChange={onChange}>x</Checkbox>);
    await userEvent.setup().click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Checkbox — branch phụ', () => {
  it('checked ban đầu + onChange undefined → click không crash', async () => {
    render(<Checkbox checked>ro</Checkbox>);
    await userEvent.setup().click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('className passthrough (label wrapper)', () => {
    render(<Checkbox className="marker">x</Checkbox>);
    expect(screen.getByText('x')).toHaveClass('marker');
  });
});
