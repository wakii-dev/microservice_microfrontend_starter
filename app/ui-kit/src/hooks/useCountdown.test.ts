// Tests useCountdown — fake timers đếm tới 0 rồi DỪNG (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('useCountdown', () => {
  it('ban đầu chưa chạy', () => {
    const { result } = renderHook(() => useCountdown(3));

    expect(result.current.seconds).toBe(3);
    expect(result.current.isRunning).toBe(false);
  });

  it('đếm từng giây tới 0 rồi tự dừng', () => {
    const { result } = renderHook(() => useCountdown(3));

    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false); // đạt 0 → dừng
  });

  it('đã dừng ở 0 thì trôi thời gian không làm giá trị âm', () => {
    const { result } = renderHook(() => useCountdown(1));

    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('stop giữ nguyên giây hiện tại', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(1500); // tick 1 lần ở 1000ms
    });
    expect(result.current.seconds).toBe(9);

    act(() => result.current.stop());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.seconds).toBe(9); // không đếm tiếp
    expect(result.current.isRunning).toBe(false);
  });

  it('reset đưa về giá trị ban đầu + dừng', () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(3);

    act(() => result.current.reset());
    expect(result.current.seconds).toBe(5);
    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(5); // reset rồi thì không chạy tiếp
  });
});
