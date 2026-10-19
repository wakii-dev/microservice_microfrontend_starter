// useMeasure — đo element qua ResizeObserver → {width,height}. Môi trường không
// có RO (jsdom cũ) → giữ {0,0}. Observer disconnect khi unmount (không rò rỉ).
import { useEffect, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

export function useMeasure<T extends HTMLElement = HTMLElement>(): [React.RefObject<T | null>, ElementSize] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const box = entries[entries.length - 1]?.contentRect;
      if (box) setSize({ width: box.width, height: box.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
