// useOnlineStatus — trạng thái mạng navigator.onLine theo thời gian thực
// (pattern usehooks.com): banner "mất kết nối", nút gửi disabled khi offline.
// jsdom/SSR không có navigator.onLine → mặc định true (không hiển thị sai cảnh báo).
import { useEffect, useState } from 'react';

/** `true` khi browser báo online — cập nhật qua event online/offline của window. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true));

  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    window.addEventListener('online', set);
    window.addEventListener('offline', set);
    return () => {
      window.removeEventListener('online', set);
      window.removeEventListener('offline', set);
    };
  }, []);

  return online;
}
