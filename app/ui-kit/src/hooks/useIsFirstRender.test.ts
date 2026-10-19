// useIsFirstRender tests — true lần render đầu, false sau, đọc được trong render.
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsFirstRender } from './useIsFirstRender.js';

describe('useIsFirstRender', () => {
  it('true ở lần render đầu', () => {
    const { result } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
  });

  it('false từ lần render thứ 2', () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(false);
    rerender();
    expect(result.current).toBe(false);
  });

  it('dùng trong render được (không phải effect) — nhánh render theo lần đầu', () => {
    const { result, rerender } = renderHook(() => ({ first: useIsFirstRender(), value: useIsFirstRender() ? 'init' : 'update' }));
    expect(result.current).toEqual({ first: true, value: 'init' });
    rerender();
    expect(result.current).toEqual({ first: false, value: 'update' });
  });
});
