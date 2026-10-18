// Tests useLockBodyScroll — body overflow hidden/restore (spec worker B).
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLockBodyScroll } from './useLockBodyScroll.js';

afterEach(() => {
  document.body.style.overflow = ''; // trả trạng thái gốc cho test khác
  cleanup();
});

describe('useLockBodyScroll', () => {
  it('locked → body overflow hidden', () => {
    expect(document.body.style.overflow).toBe('');

    renderHook(() => useLockBodyScroll(true));

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('mặc định locked = true', () => {
    renderHook(() => useLockBodyScroll());

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('đổi locked → restore overflow như cũ', () => {
    const { rerender } = renderHook(({ locked }) => useLockBodyScroll(locked), {
      initialProps: { locked: true },
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ locked: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('unmount tự restore', () => {
    const { unmount } = renderHook(() => useLockBodyScroll(true));

    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
