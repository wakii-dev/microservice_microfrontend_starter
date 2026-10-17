// useTimeout — setTimeout khai báo kiểu React: tự huỷ khi unmount, có clear/reset, pattern usehooks.com/ui.dev.
// Callback luôn lấy bản mới nhất qua ref — timer không phải dặt lại khi component render lại.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTimeoutReturn {
  /** Huỷ hẹn giờ hiện tại (nếu có). */
  clear: () => void;
  /** Chạy lại hẹn giờ với delay ban đầu. */
  reset: () => void;
}

export function useTimeout(callback: () => void, delayMs: number): UseTimeoutReturn {
  // {delay, generation} trong state — generation bảo đảm reset() luôn tạo timer mới
  // kể cả khi delay không đổi (đổi object → effect re-run + dọn timer cũ)
  const [timer, setTimer] = useState<{ delay: number | null; generation: number }>({
    delay: delayMs,
    generation: 0,
  });
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (timer.delay === null) return undefined;
    const id = setTimeout(() => callbackRef.current(), timer.delay);
    return () => clearTimeout(id); // unmount/reset/clear → không rò rỉ timer
  }, [timer]);

  const clear = useCallback(() => setTimer((t) => ({ ...t, delay: null })), []);
  const reset = useCallback(
    () => setTimer((t) => ({ delay: delayMs, generation: t.generation + 1 })),
    [delayMs],
  );

  return { clear, reset };
}
