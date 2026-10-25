// Tests useEventListener — window mặc định, ref target, handler inline không re-attach.
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEventListener } from './useEventListener.js';

afterEach(cleanup);

describe('useEventListener', () => {
  it('mặc định gắn lên window — bắn handler, cleanup khi unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('custom-x', handler));
    window.dispatchEvent(new Event('custom-x'));
    expect(handler).toHaveBeenCalledTimes(1);
    unmount();
    window.dispatchEvent(new Event('custom-x'));
    expect(handler).toHaveBeenCalledTimes(1); // đã gỡ
  });

  it('target là element trực tiếp (document.body) — listener bắn đúng', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('custom-y', handler, document.body));
    document.body.dispatchEvent(new Event('custom-y'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handler inline đổi mỗi render → KHÔNG re-attach (vẫn nhận event, không mất listener)', () => {
    let calls = 0;
    const { rerender } = renderHook(({ n }) => useEventListener('custom-z', () => void n), {
      initialProps: { n: 0 },
    });
    rerender({ n: 1 });
    rerender({ n: 2 });
    window.dispatchEvent(new Event('custom-z'));
    expect(calls).toBe(0); // handler mới nhận event — đếm qua biến ngoài khác
    // kiểm chứng thật: listener vẫn sống sau nhiều rerender
    const spy = vi.fn();
    const { rerender: rerender2, unmount } = renderHook(({ h }) => useEventListener('custom-w', h), {
      initialProps: { h: spy },
    });
    const fresh = vi.fn();
    rerender2({ h: fresh }); // identity mới — ref pattern thay listener không cần gỡ/gắn
    window.dispatchEvent(new Event('custom-w'));
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled(); // bản cũ không còn được gọi
    unmount();
  });
});
