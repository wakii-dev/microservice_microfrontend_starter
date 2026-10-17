// Tests useMediaQuery — mock window.matchMedia + simulate 'change' (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery.js';

type ChangeListener = (event: MediaQueryListEvent) => void;

// Mock MediaQueryList bắt listener để trigger change thủ công
function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const mql = {
    matches: initialMatches,
    media: '(min-width: 768px)',
    addEventListener: (_type: string, cb: ChangeListener) => {
      listeners.add(cb);
    },
    removeEventListener: (_type: string, cb: ChangeListener) => {
      listeners.delete(cb);
    },
  };
  window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
  return {
    trigger(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  cleanup();
});

describe('useMediaQuery', () => {
  it('trả về trạng thái matches ban đầu', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    mockMatchMedia(false);
    const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result2.current).toBe(false);
  });

  it('cập nhật khi media query change', () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => mm.trigger(true));
    expect(result.current).toBe(true);

    act(() => mm.trigger(false));
    expect(result.current).toBe(false);
  });

  it('unmount gỡ listener', () => {
    const mm = mockMatchMedia(false);
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    expect(mm.listenerCount()).toBe(1);

    unmount();
    expect(mm.listenerCount()).toBe(0);

    act(() => mm.trigger(true)); // không còn listener → state không đổi
    expect(result.current).toBe(false);
  });
});
