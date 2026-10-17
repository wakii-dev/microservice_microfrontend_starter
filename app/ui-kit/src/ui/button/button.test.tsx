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

describe('Button — completeness (Tier 1.5)', () => {
  it('size small/middle/large → class height riêng', () => {
    for (const [size, cls] of [
      ['small', 'h-6'],
      ['middle', 'h-8'],
      ['large', 'h-10'],
    ] as const) {
      render(<Button size={size}>{size}</Button>);
      expect(screen.getByRole('button', { name: size })).toHaveClass(cls);
      cleanup();
    }
  });

  it('loading → Spinner thay icon + disable bất kể disabled prop', () => {
    render(
      <Button type="primary" loading icon={<span data-testid="ic" />}>
        Lưu
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /Lưu/ });
    expect(btn).toBeDisabled();
    expect(btn.querySelector('[role="status"]')).not.toBeNull();
    expect(screen.queryByTestId('ic')).toBeNull();
  });

  it('block → w-full; icon hiển thị khi không loading', () => {
    render(
      <Button block icon={<span data-testid="ic2" />}>
        full
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /full/ });
    expect(btn).toHaveClass('w-full');
    expect(screen.getByTestId('ic2')).toBeInTheDocument();
  });

  it('danger + type default → rơi về variant default (không nền đỏ)', () => {
    render(
      <Button danger>
        Xoá mặc định
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Xoá mặc định' }).className).not.toContain('bg-st-fail');
  });
});

describe('Button — branch phụ (parity)', () => {
  it('danger + default → fallback variant không nền đỏ (?? branch)', () => {
    render(
      <Button danger>
        d
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'd' }).className).toContain('bg-s2');
  });

  it('htmlType reset + middle mặc định', () => {
    render(
      <Button htmlType="reset">
        r
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'r' })).toHaveAttribute('type', 'reset');
    expect(screen.getByRole('button', { name: 'r' })).toHaveClass('h-8');
  });
});
