// useOnlineStatus — trạng thái mạng qua navigator.onLine + listener online/offline
// (dọn dẹp tự động qua useEventListener). SSR-safe (mặc định true).
import { useState } from 'react';
import { useEventListener } from './useEventListener.js';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEventListener('online', () => setOnline(true));
  useEventListener('offline', () => setOnline(false));
  return online;
}
