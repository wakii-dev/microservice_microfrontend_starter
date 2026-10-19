import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollTop } from './index.js';
afterEach(cleanup);
describe('ScrollTop', () => {
  it('scrollY < threshold → ẩn', () => {
    const { container } = render(<ScrollTop />);
    expect(container.firstElementChild).toBeNull();
  });
});

describe('ScrollTop — visibility + action', () => {
  function setScrollY(v: number) {
    Object.defineProperty(window, 'scrollY', { value: v, configurable: true });
    // scroll listener setState ngoài React event — bọc act() để flush ngay
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  }

  it('scrollY > threshold → nút hiện + aria-label; click → scrollTo top', async () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    render(<ScrollTop />);
    setScrollY(600);
    const btn = screen.getByRole('button', { name: 'Về đầu trang' });
    await userEvent.setup().click(btn);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });

  it('custom threshold — scrollY dưới threshold → ẩn', () => {
    render(<ScrollTop threshold={100} />);
    setScrollY(50);
    expect(screen.queryByRole('button', { name: 'Về đầu trang' })).toBeNull();
  });
});
