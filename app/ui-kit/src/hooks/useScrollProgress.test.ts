// Tests useScrollProgress — 0 khi chưa scroll, tiến theo scrollY, clamp 0..1.
// rAF mock GỌI THẲNG callback (jsdom rAF thật không chạy trong act) → xác định.
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollProgress } from './useScrollProgress.js';

function setPageHeight(height: number) {
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(height);
}
function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
}
function mockRafSync() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useScrollProgress', () => {
  it('chưa scroll → 0; scroll giữa trang → tỉ lệ 0..1', () => {
    mockRafSync();
    setPageHeight(2000);
    setScrollY(0);
    window.innerHeight = 1000;
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);

    setScrollY(500); // (2000-1000)=1000 max → 0.5
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(0.5);
  });

  it('scroll quá đáy → clamp 1; trang ngắn hơn viewport → 0', () => {
    mockRafSync();
    setPageHeight(2000);
    window.innerHeight = 1000;
    setScrollY(9999);
    const { result, rerender } = renderHook(() => useScrollProgress());
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(1);

    setPageHeight(500); // max = 500-1000 < 0 → 0
    rerender();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(0);
  });
});
