// useHover — trạng thái hover của 1 element, pattern usehooks.com/ui.dev.
// Trả về [ref, hovered] — gắn ref lên phần tử cần theo dõi.
import { useEffect, useRef, useState } from 'react';

export function useHover<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onMouseEnter = () => setHovered(true);
    const onMouseLeave = () => setHovered(false);
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return [ref, hovered] as const;
}
