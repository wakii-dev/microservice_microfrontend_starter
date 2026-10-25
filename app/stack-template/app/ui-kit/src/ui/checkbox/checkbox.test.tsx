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


describe('Checkbox — tri-state (PrimeReact parity, 2026-10-18)', () => {
  it('checked={null} → aria-checked="mixed" + dash indeterminate, tick ẩn', () => {
    const { container } = render(<Checkbox checked={null} onChange={vi.fn()}>Chọn một phần</Checkbox>);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-checked', 'mixed');
    expect(box.className).toContain('bg-accent'); // nền accent khi tri
    const marks = Array.from(container.querySelectorAll('span[aria-hidden="true"]'));
    // dash = span chứa thanh bar; tick = span chứa SVG Icon 'check'
    const dash = marks.find((el) => el.querySelector('span.bg-white'));
    const tick = marks.find((el) => el.querySelector('svg'));
    expect(dash).toBeDefined();
    expect(dash!).toHaveClass('grid');
    expect(tick).toBeDefined();
    expect(tick!).toHaveClass('hidden');
  });

  it('prop indeterminate → mixed (đè checked=false — antd compat)', () => {
    render(<Checkbox checked={false} indeterminate onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('checked={true} → aria-checked="true" + tick grid; checked={false} → "false" + dash ẩn', () => {
    const { container, rerender } = render(<Checkbox checked onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    rerender(<Checkbox checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    const marks = Array.from(container.querySelectorAll('span[aria-hidden="true"]'));
    const dash = marks.find((el) => el.querySelector('span.bg-white'))!;
    expect(dash).toHaveClass('hidden');
  });

  it('click khi tri-state → onChange(true) (native uncheck→check)', async () => {
    const onChange = vi.fn();
    render(<Checkbox checked={null} onChange={onChange}>Tri</Checkbox>);
    await userEvent.setup().click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
