// Button tests — antd look (spec tailwind-migration + decision antd-look). API:
// type primary|default|text + danger boolean — map đúng 4 style đang dùng trong repo.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './index.js';

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
      ['small', 'h-8'],
      ['middle', 'h-9'],
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
    expect(screen.getByRole('button', { name: 'r' })).toHaveClass('h-9');
  });
});

describe('Button — modernize (vision-audit 2026-10-18)', () => {
  it('base polish: rounded-lg + font-medium + duration-150 + focus ring accent/40 + active scale 0.98', () => {
    render(<Button>polish</Button>);
    const btn = screen.getByRole('button', { name: 'polish' });
    expect(btn).toHaveClass(
      'rounded-lg',
      'font-medium',
      'duration-150',
      'focus-visible:ring-2',
      'focus-visible:ring-accent/40',
      'focus-visible:ring-offset-2',
      'focus-visible:outline-none',
      'active:scale-[0.98]',
    );
  });

  it('middle mặc định h-9 (36px antd middle)', () => {
    render(<Button>mặc định</Button>);
    expect(screen.getByRole('button', { name: 'mặc định' })).toHaveClass('h-9');
  });

  it('default variant có định nghĩa: bg-s2 + border-line, hover bg-s3 (không trắng-trên-trắng)', () => {
    render(<Button>secondary</Button>);
    expect(screen.getByRole('button', { name: 'secondary' })).toHaveClass(
      'bg-s2',
      'border-line',
      'hover:bg-s3',
    );
  });

  it('disabled dùng token --bg-disabled (dark-safe, không hex đen cứng)', () => {
    render(
      <Button disabled>
        off
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'off' })).toHaveClass(
      'disabled:bg-[var(--bg-disabled)]',
    );
  });

  it('loading → cursor-wait + Spinner size-3.5 (không phải size-3 cũ) + disable', () => {
    render(
      <Button type="primary" loading icon={<span data-testid="ic" />}>
        Lưu
      </Button>,
    );
    const btn = screen.getByRole('button', { name: /Lưu/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('cursor-wait');
    const spinner = btn.querySelector('[role="status"]');
    expect(spinner).not.toBeNull();
    // role=status là wrapper ngoài — box size nằm ở node ring bên trong
    expect(spinner!.querySelector('.size-3\\.5')).not.toBeNull();
  });

  it('padding theo size: small px-3 / middle px-4 / large px-5', () => {
    for (const [size, cls] of [
      ['small', 'px-3'],
      ['middle', 'px-4'],
      ['large', 'px-5'],
    ] as const) {
      render(<Button size={size}>{size}</Button>);
      expect(screen.getByRole('button', { name: size })).toHaveClass(cls);
      cleanup();
    }
  });
});
