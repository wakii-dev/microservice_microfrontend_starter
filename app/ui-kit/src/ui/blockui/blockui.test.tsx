// BlockUI tests — overlay chỉ khi blocked, mask token, z thang --z-*, message branch.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockUI } from './index.js';
afterEach(cleanup);
describe('BlockUI', () => {
  it('blocked → overlay + message', () => {
    render(<BlockUI blocked message="Đang xử lý"><span>content</span></BlockUI>);
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
  });
  it('not blocked → không overlay', () => {
    render(<BlockUI blocked={false}><span>content</span></BlockUI>);
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(document.querySelector('.absolute.inset-0')).toBeNull();
  });
  it('blocked không message → overlay vẫn hiện, không span (branch omitted)', () => {
    render(<BlockUI blocked><span>content</span></BlockUI>);
    expect(document.querySelector('.absolute.inset-0')).not.toBeNull();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
  it('a11y/style: overlay dùng mask token + z thang --z-* + className passthrough', () => {
    render(<BlockUI blocked message="m" className="w-40 rounded-xl"><span>c</span></BlockUI>);
    const root = screen.getByText('c').parentElement!;
    expect(root).toHaveClass('w-40', 'rounded-xl');
    const overlay = root.querySelector('.absolute.inset-0')!;
    expect(overlay.className).toContain('bg-[var(--mask)]');
    expect(overlay.className).toContain('z-[var(--z-popover)]');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('BlockUI — classNames + style', () => {
  it('slots lên đúng element: root/mask/message; className sau root slot', () => {
    render(
      <BlockUI blocked message="m" classNames={{ root: 'slot-root', mask: 'slot-mask', message: 'slot-message' }} className="user-last">
        <span data-testid="blocked-child">c</span>
      </BlockUI>,
    );
    const root = screen.getByTestId('blocked-child').parentElement!;
    expect(root).toHaveClass('slot-root');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    const overlay = root.querySelector('.absolute.inset-0')!;
    expect(overlay).toHaveClass('slot-mask');
    expect(screen.getByText('m')).toHaveClass('slot-message');
  });

  it('style passthrough lên root (merge sau class mặc định)', () => {
    render(
      <BlockUI blocked style={{ margin: '8px' }}>
        <span data-testid="style-child">x</span>
      </BlockUI>,
    );
    expect(screen.getByTestId('style-child').parentElement).toHaveStyle({ margin: '8px' });
  });
});
