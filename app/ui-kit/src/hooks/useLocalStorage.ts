// useLocalStorage — state đồng bộ 2 chiều với localStorage (JSON serialize), pattern usehooks.com/ui.dev.
// SSR-safe (window undefined → dùng initialValue); storage đầy/bị chặn → state vẫn sống trong bộ nhớ.
import { useCallback, useState } from 'react';

function readStorage<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue; // JSON hỏng hoặc storage không truy cập được
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => readStorage(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // QuotaExceeded / private mode — bỏ qua, state trong bộ nhớ vẫn cập nhật
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue] as const;
}
