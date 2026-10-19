// useControllableState tests — uncontrolled nội bộ + onChange; controlled theo
// prop; setter nhận updater fn.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useControllableState } from './useControllableState.js';

describe('useControllableState', () => {
  it('uncontrolled: defaultValue khởi tạo, setter đổi nội bộ + bắn onChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 'a', onChange }));
    expect(result.current[0]).toBe('a');
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('controlled: state theo prop; setter KHÔNG đổi nội bộ nhưng vẫn báo onChange', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(({ value }) => useControllableState({ value, defaultValue: 'a', onChange }), {
      initialProps: { value: 'x' },
    });
    expect(result.current[0]).toBe('x');
    act(() => result.current[1]('y'));
    expect(onChange).toHaveBeenCalledWith('y');
    expect(result.current[0]).toBe('x'); // vẫn theo prop
    rerender({ value: 'y' }); // prop cập nhật sau khi consumer nghe onChange
    expect(result.current[0]).toBe('y');
  });

  it('setter nhận updater fn (giá trị kế từ state hiện tại)', () => {
    const { result } = renderHook(() => useControllableState<number>({ defaultValue: 1 }));
    act(() => result.current[1]((prev) => prev + 10));
    expect(result.current[0]).toBe(11);
    act(() => result.current[1]((prev) => prev * 2));
    expect(result.current[0]).toBe(22);
  });
});
