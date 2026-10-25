// Tests useDefault — fallback defaultValue khi value null/undefined (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useDefault } from './useDefault.js';

afterEach(cleanup);

describe('useDefault', () => {
  it('không có initialValue → defaultValue', () => {
    const { result } = renderHook(() => useDefault('light'));

    expect(result.current[0]).toBe('light');
  });

  it('có initialValue → dùng initialValue', () => {
    const { result } = renderHook(() => useDefault('light', 'dark'));

    expect(result.current[0]).toBe('dark');
  });

  it('setValue(null|undefined) → quay về defaultValue', () => {
    const { result } = renderHook(() => useDefault('light', 'dark'));

    act(() => result.current[1](null));
    expect(result.current[0]).toBe('light');

    act(() => result.current[1](undefined));
    expect(result.current[0]).toBe('light');
  });

  it('setValue(giá trị thật) → dùng giá trị đó', () => {
    const { result } = renderHook(() => useDefault('light'));

    act(() => result.current[1]('sepia'));
    expect(result.current[0]).toBe('sepia');
  });
});
