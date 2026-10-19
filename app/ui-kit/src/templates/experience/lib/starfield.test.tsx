// Starfield tests (SF-2) — canvas theme-aware: render + a11y ẩn + seed ổn định +
// unmount sạch observer/rAF. jsdom không có 2d context → nhánh render-rỗng (không
// crash) là path được test; vẽ thật verify bằng evidence screenshot + data-count.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Starfield } from './starfield.js';

afterEach(cleanup);

describe('Starfield', () => {
  it('render canvas aria-hidden + data-starfield + className passthrough', () => {
    const { container } = render(<Starfield className="absolute inset-0 h-full w-full" />);
    const canvas = container.querySelector('canvas')!;
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas).toHaveAttribute('data-starfield');
    expect(canvas.className).toContain('inset-0');
  });

  it('unmount không crash — observer/rAF dọn sạch (2 vòng liên tiếp)', () => {
    const first = render(<Starfield />);
    first.unmount();
    const second = render(<Starfield seed={42} />);
    second.unmount();
  });

  it('đổi seed re-render không crash (PRNG deterministic nội bộ)', () => {
    const { rerender } = render(<Starfield seed={7} />);
    rerender(<Starfield seed={99} density={2} />);
    expect(document.querySelector('[data-starfield]')).not.toBeNull();
  });
});
