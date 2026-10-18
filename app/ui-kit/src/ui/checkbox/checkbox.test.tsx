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

describe('Checkbox — matrix gaps (disabled/controlled/className)', () => {
  it('disabled → không toggle được, không gọi onChange', async () => {
    const onChange = vi.fn();
    render(<Checkbox disabled onChange={onChange}>Khoá</Checkbox>);
    const box = screen.getByRole('checkbox');
    expect(box).toBeDisabled();
    await userEvent.setup().click(box);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('controlled — checked prop điều khiển hiển thị', () => {
    const { rerender } = render(<Checkbox checked={false} onChange={vi.fn()}>c</Checkbox>);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    rerender(<Checkbox checked onChange={vi.fn()}>c</Checkbox>);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
