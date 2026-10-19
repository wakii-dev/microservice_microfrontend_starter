// Reveal tests — IO mock: ẩn ban đầu → intersect thêm class animate có sẵn,
// once không lặp / once=false ẩn lại, delay ăn vào animationDelay, cleanup
// disconnect, fallback khi không có IntersectionObserver.
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from './index.js';

class MockIO {
  static instances: MockIO[] = [];
  disconnected = false;
  constructor(
    public cb: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    MockIO.instances.push(this);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn(() => {
    this.disconnected = true;
  });
  trigger(isIntersecting: boolean) {
    // act: setState từ IO callback phải flush vào DOM trước khi assert
    act(() => {
      this.cb([{ isIntersecting, target: {} } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    });
  }
}

beforeEach(() => {
  MockIO.instances = [];
  vi.stubGlobal('IntersectionObserver', MockIO);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const last = () => MockIO.instances[MockIO.instances.length - 1]!;

describe('Reveal', () => {
  it('ban đầu ẩn: opacity-0 + chưa có class animate; observe được gọi', () => {
    render(
      <Reveal>
        <div>card</div>
      </Reveal>,
    );
    const box = screen.getByText('card').parentElement!;
    expect(box).toHaveClass('opacity-0');
    expect(box.className).not.toContain('bp-');
    expect(last().observe).toHaveBeenCalledTimes(1);
  });

  it('intersect → thêm bp-slide-up-in (up), bỏ opacity-0', () => {
    render(
      <Reveal>
        <div>card</div>
      </Reveal>,
    );
    last().trigger(true);
    const box = screen.getByText('card').parentElement!;
    expect(box.className).toContain('bp-slide-up-in');
    expect(box).not.toHaveClass('opacity-0');
  });

  it('direction right → offset ẩn translateX(12px); vào viewport → bp-fade-in + transition transform', () => {
    render(
      <Reveal direction="right">
        <div>card</div>
      </Reveal>,
    );
    const box = screen.getByText('card').parentElement!;
    expect(box.style.transform).toBe('translateX(12px)');
    last().trigger(true);
    expect(box.className).toContain('bp-fade-in');
    expect(box.className).not.toContain('slide-up-in');
    expect(box.style.transform).toBe('none');
    expect(box.style.transition).toContain('transform');
  });

  it('direction left/down → đúng dấu offset (left −12px, down −12px theo trục)', () => {
    const left = render(<Reveal direction="left"><div>a</div></Reveal>);
    expect((screen.getByText('a').parentElement as HTMLElement).style.transform).toBe('translateX(-12px)');
    left.unmount();
    render(<Reveal direction="down"><div>b</div></Reveal>);
    expect((screen.getByText('b').parentElement as HTMLElement).style.transform).toBe('translateY(-12px)');
  });

  it('once=true → rời viewport vẫn shown; once=false → ẩn lại', () => {
    const once = render(
      <Reveal once>
        <div>keep</div>
      </Reveal>,
    );
    last().trigger(true);
    last().trigger(false);
    expect(screen.getByText('keep').parentElement!.className).toContain('bp-slide-up-in');
    once.unmount();

    render(
      <Reveal once={false}>
        <div>repeat</div>
      </Reveal>,
    );
    last().trigger(true);
    last().trigger(false);
    const box = screen.getByText('repeat').parentElement!;
    expect(box).toHaveClass('opacity-0');
    expect(box.className).not.toContain('bp-');
    last().trigger(true);
    expect(screen.getByText('repeat').parentElement!.className).toContain('bp-slide-up-in');
  });

  it('delay → animationDelay; hướng không phải up còn delay vào transition', () => {
    render(
      <Reveal direction="left" delay={150}>
        <div>card</div>
      </Reveal>,
    );
    const box = screen.getByText('card').parentElement!;
    last().trigger(true);
    expect(box.style.animationDelay).toBe('150ms');
    expect(box.style.transition).toContain('150ms');
  });

  it('cleanup: unmount → io.disconnect', () => {
    const { unmount } = render(
      <Reveal>
        <div>card</div>
      </Reveal>,
    );
    const io = last();
    unmount();
    expect(io.disconnected).toBe(true);
  });

  it('không có IntersectionObserver → hiện luôn (fallback không kẹt ẩn)', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(
      <Reveal>
        <div>fallback</div>
      </Reveal>,
    );
    const box = screen.getByText('fallback').parentElement!;
    expect(box).not.toHaveClass('opacity-0');
  });
});
