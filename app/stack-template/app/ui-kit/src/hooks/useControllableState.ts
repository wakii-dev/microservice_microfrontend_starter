// useControllableState — state "controlled/uncontrolled" kiểu antd/Radix: caller
// truyền `value` → component nằm hoàn toàn dưới quyền caller (mỗi set chỉ bắn
// onChange); không truyền → state nội bộ tự do. nhảy controlled↔uncontrolled
// giữa các render được xử lý an toàn (state nội bộ giữ giá trị mới nhất).
import { useCallback, useRef, useState } from 'react';

export interface UseControllableStateOptions<T> {
  /** Giá trị kiểm soát từ ngoài — truyền là chuyển sang chế độ controlled. */
  value?: T;
  /** Giá trị khởi tạo cho chế độ uncontrolled (không hỗ trợ lazy function —
   * nếu T là function type, bọc trong object để tránh ambiguity). */
  defaultValue?: T;
  /** Bắn kèm MỌI lần set (controlled lẫn uncontrolled) — nơi caller sync. */
  onChange?: (value: T) => void;
}

/** Trạng thái hai chế độ: `[value, set]` — `set` nhận giá trị hoặc updater. */
export function useControllableState<T>(options: UseControllableStateOptions<T>): [T, (value: T | ((prev: T) => T)) => void] {
  const { value, defaultValue, onChange } = options;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<T>(defaultValue as T);

  // Lưu giá trị controlled mới nhất để hỗ trợ updater `(prev) => …` khi caller
  // truyền value mà không lưu state riêng (prev = value hiện tại của caller).
  const controlledRef = useRef(value as T); // controlled mode: value luôn được caller cung cấp
  // uncontrolled thì ref không bao giờ được đọc (set đọc internal) — cast an toàn
  controlledRef.current = value as T;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = isControlled ? controlledRef.current : internal;
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (!isControlled) setInternal(resolved);
      onChange?.(resolved);
    },
    // `internal` chỉ dùng khi uncontrolled — re-created mỗi internal đổi là đúng.
    [isControlled, internal, onChange],
  );

  return [isControlled ? value : internal, set];
}
