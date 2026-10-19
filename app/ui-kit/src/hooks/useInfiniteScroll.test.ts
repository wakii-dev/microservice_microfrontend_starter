// useInfiniteScroll tests — sentinel được observe, lộ + hasMore → onLoadMore,
// hasMore=false không gọi, unmount disconnect.
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInfiniteScroll } from './useInfiniteScroll.js';

class MockIO {
  static instances: MockIO[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  disconnected = false;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIO.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger() {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target: this.observed[0] } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  MockIO.instances = [];
});

describe('useInfiniteScroll', () => {
  it('observe sentinel lúc mount; lộ + hasMore → onLoadMore gọi', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const onLoadMore = vi.fn();
    const { result } = renderHook(() => {
      const ref = useInfiniteScroll<HTMLDivElement>({ onLoadMore, hasMore: true });
      if (ref.current === null) ref.current = document.createElement('div');
      return ref;
    });
    const io = await waitFor(() => {
      expect(MockIO.instances.length).toBe(1);
      return MockIO.instances[0];
    });
    expect(io.observed).toContain(result.current.current);
    io.trigger();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('hasMore=false → KHÔNG observe + KHÔNG gọi; true lại → observe lại', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const onLoadMore = vi.fn();
    const { rerender } = renderHook(({ hasMore }) => {
      const ref = useInfiniteScroll<HTMLDivElement>({ onLoadMore, hasMore });
      if (ref.current === null) ref.current = document.createElement('div');
      return ref;
    }, { initialProps: { hasMore: false } });
    expect(MockIO.instances.length).toBe(0);
    rerender({ hasMore: true });
    await waitFor(() => expect(MockIO.instances.length).toBe(1));
    MockIO.instances[0].trigger();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('unmount → disconnect (không rò rỉ observer)', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const { unmount } = renderHook(() => {
      const ref = useInfiniteScroll<HTMLDivElement>({ onLoadMore: vi.fn(), hasMore: true });
      if (ref.current === null) ref.current = document.createElement('div');
      return ref;
    });
    const io = await waitFor(() => {
      expect(MockIO.instances.length).toBe(1);
      return MockIO.instances[0];
    });
    unmount();
    expect(io.disconnected).toBe(true);
  });
});
