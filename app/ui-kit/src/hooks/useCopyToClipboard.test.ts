// Tests useCopyToClipboard — mock navigator.clipboard + đường dẫn lỗi (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from './useCopyToClipboard.js';

// navigator.clipboard là accessor — phải thay qua defineProperty rồi restore
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  };
}

afterEach(cleanup);

describe('useCopyToClipboard', () => {
  it('copy thành công → copiedText + true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const restore = stubClipboard(writeText);
    try {
      const { result } = renderHook(() => useCopyToClipboard());

      let ok = false;
      await act(async () => {
        ok = await result.current[1]('hello');
      });

      expect(writeText).toHaveBeenCalledWith('hello');
      expect(ok).toBe(true);
      expect(result.current[0]).toBe('hello');
    } finally {
      restore();
    }
  });

  it('clipboard không khả dụng → false, copiedText giữ nguyên', async () => {
    const restore = stubClipboard(undefined as unknown as (text: string) => Promise<void>);
    try {
      const { result } = renderHook(() => useCopyToClipboard());

      let ok = true;
      await act(async () => {
        ok = await result.current[1]('x');
      });

      expect(ok).toBe(false);
      expect(result.current[0]).toBe('');
    } finally {
      restore();
    }
  });

  it('writeText bị từ chối → false', async () => {
    const restore = stubClipboard(vi.fn().mockRejectedValue(new Error('NotAllowedError')));
    try {
      const { result } = renderHook(() => useCopyToClipboard());

      let ok = true;
      await act(async () => {
        ok = await result.current[1]('secret');
      });

      expect(ok).toBe(false);
      expect(result.current[0]).toBe('');
    } finally {
      restore();
    }
  });

  it('copy liên tiếp → copiedText là giá trị cuối cùng', async () => {
    const restore = stubClipboard(vi.fn().mockResolvedValue(undefined));
    try {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current[1]('first');
      });
      await act(async () => {
        await result.current[1]('second');
      });

      expect(result.current[0]).toBe('second');
    } finally {
      restore();
    }
  });
});
