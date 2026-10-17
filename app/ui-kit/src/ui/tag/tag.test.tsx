// Tag tests — plain + Checkable (filter chips pattern; antd CheckableTag look,
// nhưng giữ <button aria-pressed> — a11y TỐT HƠN antd (span+onClick)).
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tag } from './index';

afterEach(cleanup);

describe('Tag plain', () => {
  it('render span nhãn', () => {
    render(<Tag>đã tạo</Tag>);
    expect(screen.getByText('đã tạo').tagName).toBe('SPAN');
  });
});

describe('Tag.Checkable', () => {
  it('checked → <button aria-pressed=true> + class active nền accent', () => {
    render(
      <Tag.Checkable checked>
        Đang làm
      </Tag.Checkable>,
    );
    const el = screen.getByRole('button', { name: 'Đang làm' });
    expect(el).toHaveAttribute('aria-pressed', 'true');
    expect(el.className).toContain('bg-accent');
  });

  it('unchecked → aria-pressed=false, click gọi onChange(true)', async () => {
    const onChange = vi.fn();
    render(
      <Tag.Checkable checked={false} onChange={onChange}>
        Tất cả
      </Tag.Checkable>,
    );
    const el = screen.getByRole('button', { name: 'Tất cả' });
    expect(el).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(el);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('className passthrough', () => {
    render(
      <Tag.Checkable checked={false} className="extra">
        X
      </Tag.Checkable>,
    );
    expect(screen.getByRole('button', { name: 'X' })).toHaveClass('extra');
  });
});
