// useInfiniteScroll — sentinel ref: element chạm viewport → gọi onLoadMore
// (IntersectionObserver, pattern usehooks.com). Guard re-entrant bằng loading
// ref: lần gọi chưa xong (promise) thì không bắn tiếp; disabled dừng observer
// mà không tháo hook. Handler nằm trong ref → không stale closure.
import { useEffect, useRef, type RefObject } from 'react';

export interface UseInfiniteScrollOptions {
  /** Gọi khi sentinel vào viewport — có thể async; đang chạy sẽ không gọi chồng. */
  onLoadMore: () => void | Promise<void>;
  /** true → ngừng kích hoạt (vd hết dữ liệu). */
  disabled?: boolean;
  /** RootMargin IO — cho nạp sớm TRƯỚC khi sentinel hiện (vd '400px'). */
  rootMargin?: string;
}

/** Gắn ref trả về lên sentinel — vào viewport là onLoadMore tự chạy. */
export function useInfiniteScroll<T extends Element = Element>(options: UseInfiniteScrollOptions): RefObject<T | null> {
  const { disabled = false, rootMargin } = options;
  const sentinelRef = useRef<T>(null);
  const loadingRef = useRef(false);
  const handlerRef = useRef(options.onLoadMore);
  handlerRef.current = options.onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || disabled || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || loadingRef.current) continue;
          loadingRef.current = true;
          Promise.resolve(handlerRef.current()).finally(() => {
            loadingRef.current = false;
          });
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disabled, rootMargin]);

  return sentinelRef;
}
