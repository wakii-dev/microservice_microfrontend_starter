// useMountEffect — chạy effect ĐÚNG 1 LẦN khi mount + cleanup khi unmount,
// pattern usehooks.com. Khác useEffect(fn, []): không cảnh báo deps. LƯU Ý:
// closure đóng băng giá trị lúc mount — cần giá trị mới nhất hãy đọc qua ref
// hoặc dùng useUpdateEffect.
import { useEffect } from 'react';

export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => effect(), []);
}
