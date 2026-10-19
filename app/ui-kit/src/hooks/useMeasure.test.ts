// useMeasure tests — Mock ResizeObserver: initial 0/0, observe element, resize
// cập nhật size, unmount disconnect.
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMeasure } from './useMeasure.js';

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  disconnected = false;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(width: number, height: number) {
    this.callback(
      [{ contentRect: { width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON: () => ({}) } } as unknown as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  MockResizeObserver.instances = [];
});

describe('useMeasure', () => {
  it('initial {width:0, height:0}; observe element lúc mount', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const { result } = renderHook(() => {
      const [ref, size] = useMeasure<HTMLDivElement>();
      if (ref.current === null) ref.current = document.createElement('div');
      return { ref, size };
    });
    expect(result.current.size).toEqual({ width: 0, height: 0 });
    await waitFor(() => {
      expect(MockResizeObserver.instances.length).toBe(1);
      expect(result.current.ref.current).not.toBeNull();
    });
    expect(MockResizeObserver.instances[0].observed).toContain(result.current.ref.current);
  });

  it('RO fire → size cập nhật theo contentRect', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const { result } = renderHook(() => {
      const [ref, size] = useMeasure<HTMLDivElement>();
      if (ref.current === null) ref.current = document.createElement('div');
      return { ref, size };
    });
    const ro = await waitFor(() => {
      expect(MockResizeObserver.instances.length).toBe(1);
      return MockResizeObserver.instances[0];
    });
    ro.trigger(320, 240);
    await waitFor(() => expect(result.current.size).toEqual({ width: 320, height: 240 }));
    ro.trigger(640, 480);
    await waitFor(() => expect(result.current.size).toEqual({ width: 640, height: 480 }));
  });

  it('unmount → disconnect (không rò rỉ observer)', async () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const { unmount } = renderHook(() => {
      const [ref] = useMeasure<HTMLDivElement>();
      if (ref.current === null) ref.current = document.createElement('div');
      return ref;
    });
    const ro = await waitFor(() => {
      expect(MockResizeObserver.instances.length).toBe(1);
      return MockResizeObserver.instances[0];
    });
    unmount();
    expect(ro.disconnected).toBe(true);
  });
});
