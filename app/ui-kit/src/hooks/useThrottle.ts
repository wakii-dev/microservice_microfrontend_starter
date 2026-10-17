// useThrottle — chặn giá trị mới tối đa 1 lần mỗi interval, pattern usehooks.com/ui.dev.
// Khác debounce: throttle đảm bảo nhịp cập nhật đều (scroll/resize/mousemove) —
// có cả leading edge (đủ khoảng cách → nhận ngay) lẫn trailing (nhận giá trị cuối cùng).
import { useEffect, useRef, useState } from 'react';

export function useThrottle<T>(value: T, intervalMs = 500): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdated.current;

    if (elapsed >= intervalMs) {
      // Leading edge — đã qua interval kể từ lần cập nhật trước
      lastUpdated.current = now;
      setThrottled(value);
      return undefined;
    }

    // Trailing edge — hẹn đúng lúc hết khoảng còn thiếu rồi mới nhận giá trị mới nhất
    const id = setTimeout(() => {
      lastUpdated.current = Date.now();
      setThrottled(value);
    }, intervalMs - elapsed);
    return () => clearTimeout(id);
  }, [value, intervalMs]);

  return throttled;
}
