// Tests useInView — probe component ATTACH ref thật vào DOM (IO cần element):
// vào viewport → true; once giữ / once=false đảo; không IO → fallback true.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView, type UseInViewOptions } from './useInView.js';

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let lastCallback: IOCallback | null = null;
let lastDisconnected = false;

class MockIntersectionObserver {
  constructor(cb: IOCallback) {
    lastCallback = cb;
  }
  observe = vi.fn();
  disconnect = vi.fn(() => {
    lastDisconnected = true;
  });
  unobserve = vi.fn();
}

function fireIntersecting(isIntersecting: boolean) {
  lastCallback?.([{ isIntersecting }]);
}

function Probe({ options }: { options?: UseInViewOptions }) {
  const { ref, inView } = useInView<HTMLDivElement>(options);
  return <div ref={ref} data-inview={String(inView)} />;
}

function inViewOf(container: HTMLElement): boolean {
  return container.querySelector('[data-inview]')!.getAttribute('data-inview') === 'true';
}

afterEach(() => {
  cleanup();
  lastCallback = null;
  lastDisconnected = false;
  vi.unstubAllGlobals();
});

describe('useInView', () => {
  it('vào viewport → true; once (mặc định) giữ true khi rời + disconnect IO', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const { container } = render(<Probe />);
    expect(inViewOf(container)).toBe(false);

    act(() => fireIntersecting(true));
    expect(inViewOf(container)).toBe(true);
    act(() => fireIntersecting(false));
    expect(inViewOf(container)).toBe(true); // once — không reset
    expect(lastDisconnected).toBe(true); // once → ngắt quan sát sau lần đầu
  });

  it('once=false → đảo 2 chiều, KHÔNG disconnect sớm', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const { container } = render(<Probe options={{ once: false }} />);
    act(() => fireIntersecting(true));
    expect(inViewOf(container)).toBe(true);
    act(() => fireIntersecting(false));
    expect(inViewOf(container)).toBe(false);
    expect(lastDisconnected).toBe(false);
  });

  it('không có IntersectionObserver → fallback inView true (không kẹt ẩn)', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = render(<Probe />);
    expect(inViewOf(container)).toBe(true);
  });
});
