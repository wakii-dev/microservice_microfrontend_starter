// Tests useThrottle — fake timers verify nhịp cập nhật theo interval (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThrottle } from './useThrottle.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('useThrottle', () => {
  it('nhiều thay đổi trong 1 interval → chỉ nhận giá trị mới nhất ở biên trailing', () => {
    const { result, rerender } = renderHook(({ v }) => useThrottle(v, 500), { initialProps: { v: 0 } });

    expect(result.current).toBe(0);

    rerender({ v: 1 });
    rerender({ v: 2 }); // 2 lần liên tiếp trong cùng interval
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(2); // chỉ giá trị mới nhất lọt qua
  });

  it('đủ khoảng cách interval → nhận ngay (leading edge)', () => {
    const { result, rerender } = renderHook(({ v }) => useThrottle(v, 500), { initialProps: { v: 'x' } });

    act(() => {
      vi.advanceTimersByTime(1000); // chạy qua interval đầu để "nhịp" ổn định
    });

    rerender({ v: 'y' });
    expect(result.current).toBe('y'); // leading — không phải chờ trailing
  });

  it('chưa đủ interval thì chưa cập nhật (trailing)', () => {
    const { result, rerender } = renderHook(({ v }) => useThrottle(v, 500), { initialProps: { v: 'x' } });

    act(() => {
      vi.advanceTimersByTime(1000); // chạy qua interval đầu để "nhịp" ổn định
    });

    rerender({ v: 'y' }); // leading — đủ khoảng cách, nhận ngay
    expect(result.current).toBe('y');

    rerender({ v: 'z' }); // ngay sau đó → phải chờ trailing ở t+500
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('y');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('z');
  });
});
