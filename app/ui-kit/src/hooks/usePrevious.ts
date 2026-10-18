// usePrevious — giá trị của lần render trước, pattern usehooks.com/ui.dev.
// Lần render đầu tiên → undefined (chưa có "trước"); so sánh prev/next props.
import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value; // ghi SAU render — giá trị trả về luôn là của render trước
  }, [value]);

  return ref.current;
}
