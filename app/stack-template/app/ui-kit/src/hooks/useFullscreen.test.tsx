// Tests useFullscreen — jsdom KHÔNG có Fullscreen API: group fallback no-op
// (không crash); group mock API: enter gọi requestFullscreen đúng element,
// fullscreenchange sync state + onChange, exit gọi exitFullscreen.
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFullscreen } from './useFullscreen.js';

function mockFullscreenApi() {
  const el = document.createElement('div');
  el.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(document, 'fullscreenElement', { value: el, configurable: true });
  document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
  return el;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // dọn property mock (defineProperty configurable)
  delete (document as unknown as Record<string, unknown>).fullscreenElement;
  delete (document as unknown as Record<string, unknown>).exitFullscreen;
});

describe('useFullscreen — fallback (jsdom không có API)', () => {
  it('enter/exit không crash, không throw; isFullscreen khởi tạo theo document', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useFullscreen({ onChange }));
    expect(result.current.isFullscreen).toBe(false);
    expect(() => {
      result.current.enter();
      result.current.exit();
      result.current.toggle();
    }).not.toThrow();
    expect(onChange).not.toHaveBeenCalled(); // không có event → không bắn
  });
});

describe('useFullscreen — mock Fullscreen API', () => {
  it('enter → requestFullscreen trên ref element; event fullscreenchange sync state + onChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useFullscreen({ onChange }));
    const host = document.createElement('div');
    result.current.ref.current = host;
    host.requestFullscreen = vi.fn().mockResolvedValue(undefined);

    act(() => result.current.enter());
    expect(host.requestFullscreen).toHaveBeenCalledTimes(1);

    // browser xử lý xong → bắn fullscreenchange với fullscreenElement đã đặt
    mockFullscreenApi();
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.isFullscreen).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('exit → exitFullscreen; toggle theo state hiện tại', async () => {
    const el = mockFullscreenApi();
    const { result } = renderHook(() => useFullscreen({ target: { current: el } }));
    // state sync qua event fullscreenchange — bắn event giả lập browser xác nhận
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.isFullscreen).toBe(true);

    act(() => result.current.toggle());
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    await Promise.resolve();
  });
});
