// useDefault — fallback defaultValue khi value là null/undefined, pattern usehooks.com/ui.dev.
// Hữu ích với props tuỳ chọn: component không cần tự `value ?? default` mọi nơi.
import { useCallback, useState } from 'react';

export function useDefault<T>(
  defaultValue: T,
  initialValue?: T | null,
): readonly [T, (value: T | null | undefined) => void] {
  const [rawValue, setRawValue] = useState<T | null | undefined>(initialValue);

  const value = rawValue ?? defaultValue;
  const setValue = useCallback((next: T | null | undefined) => setRawValue(next), []);

  return [value, setValue] as const;
}
