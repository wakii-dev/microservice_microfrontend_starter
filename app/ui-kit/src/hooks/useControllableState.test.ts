// Tests useControllableState — uncontrolled tự do, controlled theo props, cả hai đều bắn onChange.
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useControllableState } from './useControllableState.js';

afterEach(cleanup);

describe('useControllableState', () => {
  it('uncontrolled: defaultValue khởi tạo, set nội bộ cập nhật + bắn onChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState<number>({ defaultValue: 10, onChange }));
    expect(result.current[0]).toBe(10);
    act(() => result.current[1](20));
    expect(result.current[0]).toBe(20);
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('controlled: value từ props thắng, set KHÔNG đổi state nội bộ — chỉ bắn onChange', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(({ v }) => useControllableState<number>({ value: v, onChange }), {
      initialProps: { v: 1 },
    });
    act(() => result.current[1](99));
    expect(result.current[0]).toBe(1); // vẫn theo props — caller quyết định
    expect(onChange).toHaveBeenCalledWith(99);
    rerender({ v: 99 }); // caller áp dụng → UI đổi
    expect(result.current[0]).toBe(99);
  });

  it('updater dạng hàm nhận prev đúng (uncontrolled)', () => {
    const { result } = renderHook(() => useControllableState<number>({ defaultValue: 5 }));
    act(() => result.current[1]((p) => p + 1));
    act(() => result.current[1]((p) => p * 2));
    expect(result.current[0]).toBe(12);
  });
});
