// Tests useLocalStorage — mock storage in-memory + verify JSON serialize (spec worker B).
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage.js';

// In-memory Storage — localStorage của jsdom là getter-only nên phải thay qua defineProperty
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
const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

beforeEach(() => {
  storage = createMockStorage();
  Object.defineProperty(window, 'localStorage', { configurable: true, writable: true, value: storage });
});

afterEach(() => {
  if (originalDescriptor) Object.defineProperty(window, 'localStorage', originalDescriptor);
  else Reflect.deleteProperty(window, 'localStorage');
  cleanup();
});

describe('useLocalStorage', () => {
  it('đọc giá trị JSON đã lưu từ storage', () => {
    storage.setItem('ui-theme', JSON.stringify('dark'));

    const { result } = renderHook(() => useLocalStorage('ui-theme', 'light'));

    expect(result.current[0]).toBe('dark');
  });

  it('chưa có key → dùng initialValue', () => {
    const { result } = renderHook(() => useLocalStorage('ui-missing', 'light'));

    expect(result.current[0]).toBe('light');
    expect(storage.getItem('ui-missing')).toBeNull(); // không ghi trộm khi chỉ đọc
  });

  it('JSON hỏng trong storage → fallback initialValue thay vì ném lỗi', () => {
    storage.setItem('ui-broken', '{oops');

    const { result } = renderHook(() => useLocalStorage('ui-broken', 'safe'));

    expect(result.current[0]).toBe('safe');
  });

  it('setValue ghi JSON.stringify vào storage', () => {
    const { result } = renderHook(() => useLocalStorage('ui-draft', ''));

    act(() => result.current[1]('hello'));

    expect(result.current[0]).toBe('hello');
    expect(storage.getItem('ui-draft')).toBe('"hello"'); // serialize đúng
  });

  it('setValue nhận object — serialize nguyên vẹn', () => {
    const { result } = renderHook(() => useLocalStorage('ui-count', { page: 1 }));

    act(() => result.current[1]({ page: 2 }));

    expect(result.current[0]).toEqual({ page: 2 });
    expect(JSON.parse(storage.getItem('ui-count') as string)).toEqual({ page: 2 });
  });

  it('setValue nhận function updater', () => {
    const { result } = renderHook(() => useLocalStorage('ui-n', 0));

    act(() => result.current[1]((prev: number) => prev + 1));

    expect(result.current[0]).toBe(1);
    expect(storage.getItem('ui-n')).toBe('1');
  });

  it('storage ném lỗi (quota/private mode) → state vẫn cập nhật, không ném ra ngoài', () => {
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const { result } = renderHook(() => useLocalStorage('ui-quota', 0));

    act(() => result.current[1](7));

    expect(result.current[0]).toBe(7);
  });
});
