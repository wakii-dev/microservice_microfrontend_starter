// Tests useDebounce — fake timers verify giá trị "pause" khi gõ liên tục (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('useDebounce', () => {
  it('giữ giá trị cũ đến khi ngừng thay đổi đủ delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');

    // Gõ tiếp trước khi hết delay → timer bị reset, giá trị chưa lọt qua
    rerender({ value: 'ab' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    rerender({ value: 'abc' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a'); // vẫn pause — delay bị kéo lại từ đầu

    // Ngừng gõ đủ 300ms → giá trị mới lọt qua đúng 1 lần
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('abc');
  });

  it('không đổi khi advance chưa đủ delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe(1);
  });

  it('mặc định delay 500ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    });

    rerender({ value: 'y' });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('x');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('y');
  });
});
