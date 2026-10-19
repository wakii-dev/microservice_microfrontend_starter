// useMountEffect tests — chạy 1 lần, không chạy lại khi re-render, cleanup unmount.
import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMountEffect } from './useMountEffect.js';
import { useState } from 'react';

describe('useMountEffect', () => {
  it('gọi đúng 1 lần lúc mount; re-render KHÔNG gọi lại', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useMountEffect(effect));
    expect(effect).toHaveBeenCalledTimes(1);
    rerender();
    rerender();
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('cleanup chạy khi unmount (theo thứ tự sau effect)', () => {
    const calls: string[] = [];
    const { unmount } = renderHook(() =>
      useMountEffect(() => {
        calls.push('mount');
        return () => calls.push('cleanup');
      }),
    );
    expect(calls).toEqual(['mount']);
    unmount();
    expect(calls).toEqual(['mount', 'cleanup']);
  });

  it('dùng được trong component thật — mount 1 lần kể cả khi state đổi', () => {
    const spy = vi.fn();
    function Page() {
      const [n, setN] = useState(0);
      useMountEffect(spy);
      return <button onClick={() => setN(n + 1)}>{n}</button>;
    }
    const { getByRole } = render(<Page />);
    getByRole('button').click();
    getByRole('button').click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
