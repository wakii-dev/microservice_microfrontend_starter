// useInView — bản GENERIC của cơ chế Reveal (src/ui/reveal): IntersectionObserver
// trả boolean "đang trong viewport". Nhất quán semantics với Reveal:
// - `once` mặc định true (rời viewport không reset); false → đảo 2 chiều
// - rootMargin/threshold truyền thẳng IO
// - không có IntersectionObserver (SSR/môi trường lạ) → inView = true (không
//   kẹt trạng thái ẩn — cùng triết lý "fallback hiện luôn" của Reveal).
// KHÔNG refactor Reveal dùng hook này (ngoài scope — Reveal tự quản class/motion).
import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  /** Chỉ bắt lần đầu vào viewport (mặc định true — mirror Reveal). */
  once?: boolean;
  /** RootMargin IntersectionObserver (vd '0px 0px -80px 0px'). */
  rootMargin?: string;
  /** Tỉ lệ phần tử phải hiện ra để tính "in view" (0–1, mặc định 0). */
  threshold?: number;
}

export interface UseInViewReturn<T extends Element = Element> {
  /** Gắn lên element cần quan sát. */
  ref: RefObject<T | null>;
  inView: boolean;
}

/** Quan sát element vào/rời viewport — `[ref, inView]` qua object. */
export function useInView<T extends Element = Element>(options: UseInViewOptions = {}): UseInViewReturn<T> {
  const { once = true, rootMargin, threshold = 0 } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true); // fallback: không IO → coi như hiện (không kẹt ẩn, mirror Reveal)
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
