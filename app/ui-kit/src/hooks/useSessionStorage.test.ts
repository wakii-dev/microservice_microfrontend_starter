// Tests useSessionStorage — mock storage in-memory + verify JSON serialize, phạm vi sessionStorage (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSessionStorage } from './useSessionStorage.js';

function createMockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

let storage: ReturnType<typeof createMockStorage>;
const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage');

beforeEach(() => {
  storage = createMockStorage();
  Object.defineProperty(window, 'sessionStorage', { configurable: true, writable: true, value: storage });
});

afterEach(() => {
  if (originalDescriptor) Object.defineProperty(window, 'sessionStorage', originalDescriptor);
  else Reflect.deleteProperty(window, 'sessionStorage');
  cleanup();
});

describe('useSessionStorage', () => {
  it('đọc giá trị JSON đã lưu từ sessionStorage', () => {
    storage.setItem('ui-step', JSON.stringify(3));

    const { result } = renderHook(() => useSessionStorage('ui-step', 1));

    expect(result.current[0]).toBe(3);
  });

  it('chưa có key → dùng initialValue', () => {
    const { result } = renderHook(() => useSessionStorage('ui-step-missing', 1));

    expect(result.current[0]).toBe(1);
  });

  it('setValue ghi JSON.stringify vào sessionStorage', () => {
    const { result } = renderHook(() => useSessionStorage('ui-wizard', { step: 1 }));

    act(() => result.current[1]({ step: 2 }));

    expect(result.current[0]).toEqual({ step: 2 });
    expect(storage.getItem('ui-wizard')).toBe('{"step":2}'); // serialize đúng
  });

  it('setValue nhận function updater', () => {
    const { result } = renderHook(() => useSessionStorage('ui-n', 10));

    act(() => result.current[1]((prev: number) => prev - 4));

    expect(result.current[0]).toBe(6);
    expect(storage.getItem('ui-n')).toBe('6');
  });

  it('JSON hỏng → fallback initialValue thay vì ném lỗi', () => {
    storage.setItem('ui-bad', 'not-json');

    const { result } = renderHook(() => useSessionStorage('ui-bad', 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });
});
