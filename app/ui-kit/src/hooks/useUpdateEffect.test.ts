// useUpdateEffect tests — bỏ qua mount, chạy khi deps đổi, không deps = mọi render từ lần 2.
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUpdateEffect } from './useUpdateEffect.js';

describe('useUpdateEffect', () => {
  it('bỏ qua lần đầu (mount không gọi)', () => {
    const effect = vi.fn();
    renderHook(() => useUpdateEffect(effect, [1]));
    expect(effect).not.toHaveBeenCalled();
  });

  it('deps đổi → chạy (deps []: đổi 1→2)', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ dep }) => useUpdateEffect(effect, [dep]), {
      initialProps: { dep: 1 },
    });
    expect(effect).not.toHaveBeenCalled();
    rerender({ dep: 2 });
    expect(effect).toHaveBeenCalledTimes(1);
    rerender({ dep: 2 }); // cùng giá trị → không chạy
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('không truyền deps → chạy ở mọi render từ lần 2', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useUpdateEffect(effect));
    expect(effect).not.toHaveBeenCalled();
    rerender();
    rerender();
    expect(effect).toHaveBeenCalledTimes(2);
  });
});
