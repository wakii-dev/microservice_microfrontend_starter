// Tests useIsFirstRender — true ở render đầu, false từ render sau, không re-render thêm.
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsFirstRender } from './useIsFirstRender.js';

afterEach(cleanup);

describe('useIsFirstRender', () => {
  it('true ở lần render đầu, false từ lần rerender', () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(false);
    rerender();
    expect(result.current).toBe(false);
  });

  it('không gây re-render phụ (render count = số lần caller render)', () => {
    let renders = 0;
    const { rerender } = renderHook(() => {
      useIsFirstRender();
      renders += 1;
      return null;
    });
    expect(renders).toBe(1);
    rerender();
    rerender();
    expect(renders).toBe(3); // hook không tự trigger render thêm
  });
});
