// useInView — chuẩn react-intersection-observer (PO 1.0.0 đổi tên từ
// useIntersection): (ref?, options {threshold|root|rootMargin|once}) →
// { ref, inView, entry }. Không truyền ref → hook tự tạo và trả về để gắn lên
// element. once=true → disconnect ngay lần đầu isIntersecting (khoá inView,
// không lặp). Môi trường không có IO (jsdom cũ) → {inView:false} an toàn.
// Cleanup disconnect khi unmount/đổi options (không rò rỉ observer).
import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  /** Ngưỡng lộ 0..1 (một số hoặc mảng) — truyền thẳng IO. */
  threshold?: number | number[];
  /** Root của viewport (mặc định document viewport). */
  root?: Element | Document | null;
  /** Lề mở rộng viewport — vd '200px' tải trước. */
  rootMargin?: string;
  /** true → sau lần đầu isIntersecting: disconnect + khoá inView=true. */
  once?: boolean;
}

export interface UseInViewReturn<T extends Element> {
  /** Ref gắn lên element cần quan sát (hook tự tạo nếu không truyền vào). */
  ref: RefObject<T | null>;
  inView: boolean;
  /** Entry IO cuối cùng (ratio, boundingRect… — dùng khi cần chi tiết). */
  entry?: IntersectionObserverEntry;
}

export function useInView<T extends Element = Element>(
  ref?: RefObject<T | null>,
  options?: UseInViewOptions,
): UseInViewReturn<T> {
  const internalRef = useRef<T | null>(null);
  const targetRef = ref ?? internalRef;
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | undefined>(undefined);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const { threshold, root, rootMargin, once } = options ?? {};
    const io = new IntersectionObserver(
      (entries) => {
        const last = entries[entries.length - 1];
        if (!last) return;
        setEntry(last);
        setInView(last.isIntersecting);
        if (once && last.isIntersecting) io.disconnect();
      },
      { threshold, root, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
    // options serialize để so sánh (object mới mỗi render không re-observe)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetRef, options && JSON.stringify(options)]);

  return { ref: targetRef, inView, entry };
}
