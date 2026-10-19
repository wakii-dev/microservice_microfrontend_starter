// useFullscreen tests — enter gọi requestFullscreen đúng element, exit gọi
// document.exitFullscreen, isFullscreen theo fullscreenchange (mock API jsdom).
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useFullscreen } from './useFullscreen.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
});

describe('useFullscreen', () => {
  it('enter → requestFullscreen trên target ref (fallback documentElement)', () => {
    const el = document.createElement('div');
    el.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      ref.current = el;
      const fs = useFullscreen(ref);
      return { ref, fs };
    });
    act(() => result.current.fs.enter());
    expect(el.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('exit → document.exitFullscreen; toggle bám fullscreenElement', () => {
    const exitSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'exitFullscreen', { value: exitSpy, configurable: true });
    const { result } = renderHook(() => useFullscreen());
    Object.defineProperty(document, 'fullscreenElement', { value: document.createElement('div'), configurable: true });
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.isFullscreen).toBe(true);
    act(() => result.current.toggle()); // đang fullscreen → exit
    expect(exitSpy).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    expect(result.current.isFullscreen).toBe(false);
  });

  it('không có Fullscreen API (jsdom) → enter/exit no-op KHÔNG nổ', () => {
    const el = document.createElement('div'); // không gắn requestFullscreen
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      ref.current = el;
      return useFullscreen(ref);
    });
    expect(() => {
      act(() => result.current.enter());
      act(() => result.current.exit());
      act(() => result.current.toggle());
    }).not.toThrow();
    expect(result.current.isFullscreen).toBe(false);
  });
});
