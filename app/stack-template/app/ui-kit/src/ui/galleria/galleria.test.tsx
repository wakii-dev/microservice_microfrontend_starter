import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Galleria } from './index.js';
afterEach(cleanup);

const IMAGES = [
  { src: '/a.png', alt: 'a' },
  { src: '/b.png', alt: 'b', caption: 'Caption B' },
];

describe('Galleria', () => {
  it('renders images + captions + dots', () => {
    render(<Galleria images={IMAGES} />);
    expect(screen.getByAltText('a')).toBeInTheDocument();
    expect(screen.getByAltText('b')).toBeInTheDocument();
    expect(screen.getByText('Caption B')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Ảnh/ }).length).toBe(2);
  });

  it('ảnh không caption → không p trống; caption chỉ ở đúng ảnh', () => {
    render(<Galleria images={IMAGES} />);
    expect(screen.queryByText('Caption A')).toBeNull();
    // caption là <p> — chỉ 1 caption cho 2 ảnh
    expect(document.querySelectorAll('p').length).toBe(1);
  });

  it('dot đầu active ngay (aria-current); dot còn lại không', () => {
    render(<Galleria images={IMAGES} />);
    const dots = screen.getAllByRole('button', { name: /Ảnh/ });
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    expect(dots[1]).not.toHaveAttribute('aria-current');
  });

  it('click dot → aria-current chuyển + scrollTo tới đúng vị trí track', async () => {
    const user = userEvent.setup();
    // jsdom không có Element.scrollTo — stub thủ công (browser thật có sẵn)
    const scrollTo = vi.fn();
    const proto = HTMLElement.prototype as unknown as { scrollTo?: unknown };
    const hadScrollTo = 'scrollTo' in proto;
    const original = proto.scrollTo;
    Object.defineProperty(proto, 'scrollTo', { configurable: true, value: scrollTo });
    try {
      render(<Galleria images={IMAGES} />);
      const dots = screen.getAllByRole('button', { name: /Ảnh/ });
      await user.click(dots[1]!);
      expect(dots[1]).toHaveAttribute('aria-current', 'true');
      expect(dots[0]).not.toHaveAttribute('aria-current');
      expect(scrollTo).toHaveBeenCalledWith({ left: expect.any(Number), behavior: 'smooth' });
    } finally {
      if (hadScrollTo) (proto as { scrollTo: unknown }).scrollTo = original;
      else delete (proto as { scrollTo?: unknown }).scrollTo;
    }
  });

  it('className passthrough lên container', () => {
    const { container } = render(<Galleria images={IMAGES} className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
  });

  it('1 ảnh → 1 dot, active ngay', () => {
    render(<Galleria images={[IMAGES[0]!]} />);
    const dots = screen.getAllByRole('button', { name: /Ảnh/ });
    expect(dots).toHaveLength(1);
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
  });
});
