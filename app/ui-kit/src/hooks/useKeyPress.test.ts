// Tests useKeyPress — keydown/keyup trên window (spec worker B).
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKeyPress } from './useKeyPress.js';

afterEach(cleanup);

describe('useKeyPress', () => {
  it('keydown → true, keyup → false', () => {
    const { result } = renderHook(() => useKeyPress('Escape'));

    expect(result.current).toBe(false);

    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(result.current).toBe(true);

    act(() => {
      fireEvent.keyUp(window, { key: 'Escape' });
    });
    expect(result.current).toBe(false);
  });

  it('bỏ qua phím khác', () => {
    const { result } = renderHook(() => useKeyPress('Enter'));

    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
    });
    expect(result.current).toBe(false);
  });

  it('callback onPress nhận đúng event khi nhấn phím target', () => {
    const onPress = vi.fn();
    renderHook(() => useKeyPress('Enter', onPress));

    fireEvent.keyDown(window, { key: 'a' });
    expect(onPress).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress.mock.calls[0][0].key).toBe('Enter');
  });
});
