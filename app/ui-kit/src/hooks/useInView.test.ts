// useInView tests — threshold truyền đúng IO · fire theo isIntersecting ·
// once khoá không lặp (disconnect) · unmount disconnect · rootMargin + ref
// truyền vào được dùng.
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from './useInView.js';

class MockIO {
  static instances: MockIO[] = [];
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observed: Element[] = [];
  disconnected = false;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIO.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(isIntersecting: boolean, ratio = isIntersecting ? 1 : 0) {
    this.callback(
      [{ isIntersecting, intersectionRatio: ratio, target: this.observed[0] } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  MockIO.instances = [];
});

describe('useInView', () => {
  it('threshold + rootMargin truyền thẳng vào IO constructor; fire → inView true', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const { result } = renderHook(() => {
      const v = useInView<HTMLDivElement>(undefined, { threshold: 0.5, rootMargin: '200px' });
      if (v.ref.current === null) v.ref.current = document.createElement('div');
      return v;
    });
    const io = await waitFor(() => {
      expect(MockIO.instances.length).toBe(1);
      return MockIO.instances[0];
    });
    expect(io.options).toMatchObject({ threshold: 0.5, rootMargin: '200px' });
    expect(result.current.inView).toBe(false);
    io.trigger(true, 0.75);
    await waitFor(() => expect(result.current.inView).toBe(true));
  });

  it('once=true: lần đầu intersect → disconnect + khoá inView (trigger ngược không lùi)', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const { result } = renderHook(() => {
      const v = useInView<HTMLDivElement>(undefined, { once: true });
      if (v.ref.current === null) v.ref.current = document.createElement('div');
      return v;
    });
    const io = await waitFor(() => MockIO.instances[0]);
    io.trigger(true);
    await waitFor(() => expect(result.current.inView).toBe(true));
    expect(io.disconnected).toBe(true); // once → disconnect ngay
    io.trigger(false); // sau disconnect — callback không còn bắn
    expect(result.current.inView).toBe(true); // khoá, không lặp
  });

  it('unmount → disconnect (spy, không rò rỉ observer); không có IO → an toàn', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const { unmount } = renderHook(() => {
      const v = useInView<HTMLDivElement>();
      if (v.ref.current === null) v.ref.current = document.createElement('div');
      return v;
    });
    const io = await waitFor(() => {
      expect(MockIO.instances.length).toBe(1);
      return MockIO.instances[0];
    });
    unmount();
    expect(io.disconnected).toBe(true);
    // không có IO (bỏ stub) — hook không nổ, inView giữ false
    vi.unstubAllGlobals();
    const safe = renderHook(() => useInView<HTMLDivElement>());
    expect(safe.result.current.inView).toBe(false);
  });

  it('ref truyền vào được dùng (không tạo ref mới); entry giữ entry cuối', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const el = document.createElement('div');
    const { result } = renderHook(() => {
      const ref = { current: el } as React.RefObject<HTMLDivElement>;
      return useInView(ref);
    });
    const io = await waitFor(() => MockIO.instances[0]);
    expect(io.observed).toContain(el);
    expect(result.current.ref.current).toBe(el);
    io.trigger(true, 0.4);
    await waitFor(() => expect(result.current.entry?.intersectionRatio).toBe(0.4));
  });

  it('rời viewport → inView false (mặc định hai chiều khi không once)', async () => {
    vi.stubGlobal('IntersectionObserver', MockIO);
    const { result } = renderHook(() => {
      const v = useInView<HTMLDivElement>();
      if (v.ref.current === null) v.ref.current = document.createElement('div');
      return v;
    });
    const io = await waitFor(() => MockIO.instances[0]);
    io.trigger(true);
    await waitFor(() => expect(result.current.inView).toBe(true));
    io.trigger(false);
    await waitFor(() => expect(result.current.inView).toBe(false));
  });
});
