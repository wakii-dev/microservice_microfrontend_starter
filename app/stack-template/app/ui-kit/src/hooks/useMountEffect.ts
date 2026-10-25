// useMountEffect — chạy effect ĐÚNG MỘT LẦN khi mount, pattern usehooks.com.
// Dùng cho fetch init / đo DOM / subscription không phụ thuộc props — tránh
// phải viết mảng deps [] và đọc nhầm "chạy lại khi deps đổi".
import { useEffect } from 'react';

/** Chạy `effect` một lần duy nhất sau lần render đầu (không cleanup). */
export function useMountEffect(effect: () => void): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chủ đích: chỉ mount
  useEffect(effect, []);
}
