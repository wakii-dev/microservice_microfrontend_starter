// useScrollProgress tests — element ratio 0→x, window scroll, clamp + không cuộn được.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRef } from 'react';
import { useScrollProgress } from './useScrollProgress.js';

/** dispatch scroll rồi chờ rAF update (jsdom có requestAnimationFrame). */
async function scrollAndSettle(el: EventTarget) {
  await act(async () => {
    el.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 30));
  });
}

describe('useScrollProgress', () => {
  it('element: scrollTop/scrollHeight → 0.5 đúng ratio sau scroll (capture document)', async () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      const p = useScrollProgress(ref);
      return { ref, p };
    });
    const el = document.createElement('div');
    document.body.appendChild(el); // gắn vào document — capture listener mới thấy
    Object.defineProperty(el, 'scrollHeight', { value: 400, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(el, 'scrollTop', { value: 150, configurable: true }); // 150/300 = 0.5
    result.current.ref.current = el;
    await scrollAndSettle(el);
    el.remove();
    expect(result.current.p).toBe(0.5);
  });

  it('window: scrollY/max → progress + clamp ở 1', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    const { result } = renderHook(() => useScrollProgress());
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true }); // 500/1000
    await scrollAndSettle(document); // dispatch ở document — listener capture trên document nhận
    expect(result.current).toBe(0.5);
    Object.defineProperty(window, 'scrollY', { value: 9000, configurable: true });
    await scrollAndSettle(document);
    expect(result.current).toBe(1);
  });

  it('element không cuộn được (scrollHeight == clientHeight) → 0 bất kể scrollTop', async () => {
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      const p = useScrollProgress(ref);
      return { ref, p };
    });
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(el, 'scrollTop', { value: 50, configurable: true });
    document.body.appendChild(el);
    result.current.ref.current = el;
    await scrollAndSettle(el);
    el.remove();
    expect(result.current.p).toBe(0);
  });
});
