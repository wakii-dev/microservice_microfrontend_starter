// Tests useMountEffect — chạy 1 lần lúc mount, không chạy lại khi rerender.
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMountEffect } from './useMountEffect.js';

afterEach(cleanup);

describe('useMountEffect', () => {
  it('gọi effect đúng 1 lần khi mount', () => {
    const effect = vi.fn();
    renderHook(() => useMountEffect(effect));
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('KHÔNG chạy lại khi rerender (deps rỗng có chủ đích)', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ v }) => useMountEffect(() => effect()), { initialProps: { v: 1 } });
    rerender({ v: 2 });
    rerender({ v: 3 });
    expect(effect).toHaveBeenCalledTimes(1);
  });
});
