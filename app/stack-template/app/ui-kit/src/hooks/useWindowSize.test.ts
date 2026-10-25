// Tests useWindowSize — đọc + cập nhật theo sự kiện resize (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useWindowSize } from './useWindowSize.js';

afterEach(cleanup);

describe('useWindowSize', () => {
  it('đọc kích thước hiện tại của window', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current).toEqual({ width: window.innerWidth, height: window.innerHeight });
  });

  it('cập nhật khi window resize', () => {
    const prevWidth = window.innerWidth;
    const prevHeight = window.innerHeight;
    try {
      const { result } = renderHook(() => useWindowSize());

      window.innerWidth = 1280;
      window.innerHeight = 800;
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toEqual({ width: 1280, height: 800 });
    } finally {
      window.innerWidth = prevWidth;
      window.innerHeight = prevHeight;
    }
  });
});
