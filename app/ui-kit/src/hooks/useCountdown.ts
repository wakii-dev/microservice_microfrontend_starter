// useCountdown — đếm ngược giây tới 0 rồi tự dừng, pattern usehooks.com/ui.dev.
// Có start/stop/reset; không đếm âm (Math.max(0, ...)).
import { useCallback, useEffect, useState } from 'react';

export interface UseCountdownReturn {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useCountdown(initialSeconds: number, intervalMs = 1000): UseCountdownReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1)); // không đếm âm
    }, intervalMs);
    return () => clearInterval(id);
  }, [isRunning, intervalMs]);

  // Đạt 0 → tự dừng
  useEffect(() => {
    if (seconds === 0) setIsRunning(false);
  }, [seconds]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return { seconds, isRunning, start, stop, reset };
}
