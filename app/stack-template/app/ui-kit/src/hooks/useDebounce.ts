// useDebounce — trì hoãn giá trị mới đến khi ngừng thay đổi đủ delay, pattern usehooks.com/ui.dev.
// Input search/autosave: mỗi lần gõ reset hẹn giờ → chỉ nhận giá trị "đã dừng gõ".
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id); // value/delay đổi → huỷ hẹn giờ cũ (chính là cơ chế "pause")
  }, [value, delayMs]);

  return debounced;
}
