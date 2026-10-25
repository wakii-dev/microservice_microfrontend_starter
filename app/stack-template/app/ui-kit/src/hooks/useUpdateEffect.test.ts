// Tests useUpdateEffect — skip mount, chạy từ update thứ 2, theo deps.
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUpdateEffect } from './useUpdateEffect.js';

afterEach(cleanup);

describe('useUpdateEffect', () => {
  it('BỎ QUA lần mount, chạy từ lần thay đổi deps thứ nhất', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ v }) => useUpdateEffect(effect, [v]), { initialProps: { v: 1 } });
    expect(effect).not.toHaveBeenCalled(); // mount — skip
    rerender({ v: 2 });
    expect(effect).toHaveBeenCalledTimes(1);
    rerender({ v: 3 });
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it('deps không đổi → không chạy khi rerender', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ v }) => useUpdateEffect(effect, [v]), { initialProps: { v: 1 } });
    rerender({ v: 1 }); // giá trị giống nhau → effect không chạy
    expect(effect).not.toHaveBeenCalled();
  });
});
