// Tests useMeasure — probe attach + rect holder mutable: mount đo đúng rect;
// ResizeObserver fire với rect mới → size cập nhật; không RO → fallback tĩnh.
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMeasure } from './useMeasure.js';

type ROCallback = (entries: unknown[]) => void;
let lastROCallback: ROCallback | null = null;

class MockResizeObserver {
  constructor(cb: ROCallback) {
    lastROCallback = cb;
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

function Probe({ rect }: { rect: { current: { width: number; height: number } } }) {
  const [ref, size] = useMeasure<HTMLDivElement>();
  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (el) vi.spyOn(el, 'getBoundingClientRect').mockImplementation(() => rect.current as DOMRect);
      }}
      data-size={`${size.width}x${size.height}`}
    />
  );
}

afterEach(() => {
  cleanup();
  lastROCallback = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useMeasure', () => {
  it('đo đúng getBoundingClientRect lúc mount; RO fire rect mới → cập nhật', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const rect = { current: { width: 320, height: 80 } };
    const { container } = render(<Probe rect={rect} />);
    expect(container.querySelector('[data-size]')!.getAttribute('data-size')).toBe('320x80');

    rect.current = { width: 480, height: 96 }; // element "resize" thật
    act(() => lastROCallback?.([]));
    expect(container.querySelector('[data-size]')!.getAttribute('data-size')).toBe('480x96');
  });

  it('không có ResizeObserver → vẫn đo 1 lần lúc mount (fallback tĩnh)', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const rect = { current: { width: 640, height: 120 } };
    const { container } = render(<Probe rect={rect} />);
    expect(container.querySelector('[data-size]')!.getAttribute('data-size')).toBe('640x120');
  });
});
