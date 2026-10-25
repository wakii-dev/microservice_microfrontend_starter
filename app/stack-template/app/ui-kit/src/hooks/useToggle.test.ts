// Tests useToggle — đảo giá trị boolean + set trực tiếp (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useToggle } from './useToggle.js';

afterEach(cleanup);

describe('useToggle', () => {
  it('mặc định false → toggle đảo true → false', () => {
    const { result } = renderHook(() => useToggle());

    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('nhận initialValue', () => {
    const { result } = renderHook(() => useToggle(true));

    expect(result.current[0]).toBe(true);
  });

  it('toggle(true/false) đặt giá trị trực tiếp', () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);

    act(() => result.current[1](true)); // set cùng giá trị không "đảo"
    expect(result.current[0]).toBe(true);

    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
  });

  it('toggle nhận function updater', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => result.current[1]((prev) => !prev));
    expect(result.current[0]).toBe(true);
  });
});
