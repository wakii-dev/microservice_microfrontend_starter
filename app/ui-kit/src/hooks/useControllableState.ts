// useControllableState — cầu controlled/uncontrolled (chuẩn hoá pattern
// useDefault mở rộng value/onChange): truyền `value` → state THEO PROP, setter
// chỉ bắn onChange; không → quản nội bộ từ defaultValue (setter vẫn bắn
// onChange). Setter nhận giá trị hoặc updater fn.
import { useCallback, useState } from 'react';

export interface UseControllableStateOptions<T> {
  /** Controlled — truyền thì state theo prop (setter chỉ báo onChange). */
  value?: T;
  /** Uncontrolled — giá trị khởi tạo (bỏ qua khi `value` có mặt). */
  defaultValue: T;
  /** Bắn mỗi lần setter gọi — nhận giá trị MỚI đã resolve. */
  onChange?: (value: T) => void;
}

export function useControllableState<T>(options: UseControllableStateOptions<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const { value, defaultValue, onChange } = options;
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const base = controlled ? (value as T) : inner;
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(base) : next;
      if (!controlled) setInner(resolved);
      onChange?.(resolved);
    },
    [controlled, value, inner, onChange],
  );

  return [current, set];
}
