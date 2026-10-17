// Button tests — antd look (spec tailwind-migration + decision antd-look). API:
// type primary|default|text + danger boolean — map đúng 4 style đang dùng trong repo.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './index';

afterEach(cleanup);

describe('Button', () => {
  it('default type → <button> + class variant default, click gọi onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick}>
        <span>Tải thêm</span>
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Tải thêm' });
    expect(btn.tagName).toBe('BUTTON');
    await userEvent.setup().click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('type=primary → class bg-accent trắng chữ; disabled chặn click', async () => {
    const onClick = vi.fn();
    render(
      <Button type="primary" disabled onClick={onClick}>
        Tạo task
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Tạo task' });
    expect(btn.className).toContain('bg-accent');
    expect(btn).toBeDisabled();
    await userEvent.setup().click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('danger + type text → class chữ đỏ (danger-ghost pattern cũ)', () => {
    render(
      <Button type="text" danger>
        Xoá
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Xoá' }).className).toContain('text-st-fail');
  });

  it('danger + type primary → nền đỏ (danger solid pattern cũ)', () => {
    render(
      <Button type="primary" danger>
        Xác nhận xoá
      </Button>,
    );
    const cls = screen.getByRole('button', { name: 'Xác nhận xoá' }).className;
    expect(cls).toContain('bg-st-fail');
  });

  it('htmlType submit cho form', () => {
    render(
      <Button type="primary" htmlType="submit">
        Lưu
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveAttribute('type', 'submit');
  });

  it('className passthrough append sau structural', () => {
    render(<Button className="w-full">full</Button>);
    expect(screen.getByRole('button', { name: 'full' })).toHaveClass('w-full');
  });
});
