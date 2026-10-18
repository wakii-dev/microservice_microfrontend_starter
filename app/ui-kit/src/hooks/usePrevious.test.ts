// Tests usePrevious — giá trị của lần render trước (spec worker B).
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { usePrevious } from './usePrevious.js';

afterEach(cleanup);

describe('usePrevious', () => {
  it('lần render đầu → undefined', () => {
    const { result } = renderHook(({ value }) => usePrevious(value), { initialProps: { value: 1 } });

    expect(result.current).toBeUndefined();
  });

  it('sau mỗi lần đổi giá trị → trả về giá trị trước đó', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), { initialProps: { value: 1 } });

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it('value không đổi giữa các render → previous đã đồng bộ bằng chính nó', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), { initialProps: { value: 'a' } });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    // value không đổi → effect không chạy lại, ref đã là 'b' từ lần commit trước
    rerender({ value: 'b' });
    expect(result.current).toBe('b');
  });
});
