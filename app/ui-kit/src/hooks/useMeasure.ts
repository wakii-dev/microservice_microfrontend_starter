// useMeasure — đo kích thước element theo thời gian thực (ResizeObserver,
// pattern usehooks.com/react-use-measure): ảnh/card cần vẽ đè theo width,
// virtualization, chart responsive. Fallback không RO (môi trường cũ): đo 1
// lần bằng getBoundingClientRect lúc mount — giá trị tĩnh, không auto-update.
import { useEffect, useRef, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/** Đo element gắn `ref` — trả `[ref, size]`, size cập nhật mỗi lần element resize. */
export function useMeasure<T extends HTMLElement = HTMLElement>(): [RefObject<T | null>, ElementSize] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) => (prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height }));
    };
    measure(); // giá trị đầu ngay khi mount
    if (typeof ResizeObserver === 'undefined') return; // fallback tĩnh
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
