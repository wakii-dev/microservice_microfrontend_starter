// useOnlineStatus tests — theo navigator.onLine, đổi theo event online/offline.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useOnlineStatus } from './useOnlineStatus.js';

describe('useOnlineStatus', () => {
  it('khởi tạo theo navigator.onLine (jsdom mặc định true)', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(navigator.onLine);
  });

  it('event offline → false; online → true (2 chiều)', () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
  });

  it('nhiều event liên tiếp — trạng thái bám event cuối', () => {
    const { result } = renderHook(() => useOnlineStatus());
    act(() => {
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });
});
