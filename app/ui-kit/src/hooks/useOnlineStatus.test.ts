// Tests useOnlineStatus — đọc navigator.onLine ban đầu; event offline/online +
// navigator.onLine (stub — jsdom không tự flip) cập nhật state.
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useOnlineStatus } from './useOnlineStatus.js';

afterEach(cleanup);

function stubOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('useOnlineStatus', () => {
  it('đọc navigator.onLine ban đầu; event offline → false, online → true', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true); // jsdom mặc định onLine=true

    act(() => {
      stubOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      stubOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('unmount → gỡ listener (dispatch không crash, không đổi state)', () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();
    expect(() => window.dispatchEvent(new Event('offline'))).not.toThrow();
  });
});
