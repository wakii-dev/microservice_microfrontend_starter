// useEventListener tests — handler nhận event, cleanup gỡ sạch (spy), ref target.
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useEventListener } from './useEventListener.js';

afterEach(() => vi.restoreAllMocks());

describe('useEventListener', () => {
  it('window mặc định: dispatch event → handler nhận, nhiều lần', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('resize', handler));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('cleanup: spy add/remove được gọi khi mount/unmount; event sau unmount không vào handler', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('online', handler));
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function), undefined);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function), undefined);
    window.dispatchEvent(new Event('online'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('ref target: listener gắn lên ELEMENT (không phải window), dispatch trên element vào handler', () => {
    const handler = vi.fn();
    const el = document.createElement('button');
    el.addEventListener = vi.fn(el.addEventListener.bind(el));
    const { result } = renderHook(() => {
      const ref = useRef<HTMLButtonElement | null>(el);
      useEventListener('click', handler, ref);
      return ref;
    });
    expect(result.current.current).toBe(el);
    expect(el.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined);
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
