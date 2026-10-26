// Link tests — antd Typography.Link/MUI Link parity: render <a> với href,
// onClick nhận event (preventDefault được), disabled chặn click + bỏ href,
// underline mode classes.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Link } from './index.js';

afterEach(cleanup);

describe('Link', () => {
  it('render <a> với href + children', () => {
    render(<Link href="/tasks">Tasks</Link>);
    const a = screen.getByRole('link', { name: 'Tasks' });
    expect(a.tagName).toBe('A');
    expect(a).toHaveAttribute('href', '/tasks');
  });

  it('click → onClick nhận event, consumer preventDefault được', async () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(<Link href="/x" onClick={onClick}>Go</Link>);
    await userEvent.setup().click(screen.getByRole('link', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].defaultPrevented).toBe(true);
  });

  it('disabled → bỏ href + aria-disabled + click KHÔNG gọi onClick', async () => {
    const onClick = vi.fn();
    render(<Link href="/x" disabled onClick={onClick}>Delete</Link>);
    const a = screen.getByText('Delete');
    expect(a).not.toHaveAttribute('href');
    expect(a).toHaveAttribute('aria-disabled', 'true');
    expect(a.className).toContain('cursor-not-allowed');
    await userEvent.setup().click(a);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('underline modes → class tương ứng (none/hover/always)', () => {
    const { rerender } = render(<Link href="/a" underline="none">L</Link>);
    expect(screen.getByRole('link').className).toContain('no-underline');
    rerender(<Link href="/a" underline="always">L</Link>);
    expect(screen.getByRole('link').className).toContain('underline');
    expect(screen.getByRole('link').className).not.toContain('no-underline');
    rerender(<Link href="/a">L</Link>);
    expect(screen.getByRole('link').className).toContain('hover:underline');
  });

  it('màu accent + focus ring chuẩn (không ring-offset)', () => {
    render(<Link href="/a">Styled</Link>);
    const cls = screen.getByRole('link').className;
    expect(cls).toContain('text-accent');
    expect(cls).toContain('hover:text-accent-hi');
    expect(cls).toContain('focus-visible:ring-2');
    expect(cls).toContain('focus-visible:ring-accent/40');
    expect(cls).not.toContain('ring-offset');
  });

  it('className passthrough + passthrough anchor props (target/rel)', () => {
    render(
      <Link href="/ext" className="text-body" target="_blank" rel="noreferrer">
        Ext
      </Link>,
    );
    const a = screen.getByRole('link', { name: 'Ext' });
    expect(a).toHaveClass('text-body');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noreferrer');
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('Link — classNames + style', () => {
  it('slot root lên <a> cả thường lẫn disabled; className sau slot', () => {
    const { rerender } = render(
      <Link href="/docs" classNames={{ root: 'slot-root' }} className="user-last">
        Docs
      </Link>,
    );
    let a = screen.getByText('Docs');
    expect(a).toHaveClass('slot-root');
    expect(a.className.indexOf('slot-root')).toBeLessThan(a.className.indexOf('user-last'));
    rerender(
      <Link disabled classNames={{ root: 'slot-root' }}>
        Off
      </Link>,
    );
    a = screen.getByText('Off');
    expect(a).toHaveClass('slot-root');
  });

  it('style passthrough lên <a> (qua anchor attrs)', () => {
    render(<Link href="/x" style={{ padding: '2px' }}>Padded</Link>);
    expect(screen.getByText('Padded')).toHaveStyle({ padding: '2px' });
  });
});
