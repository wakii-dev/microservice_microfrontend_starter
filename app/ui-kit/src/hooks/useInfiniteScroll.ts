// useInfiniteScroll — trả ref gắn lên SENTINEL cuối danh sách; IO thấy sentinel
// lộ && hasMore → onLoadMore() (mỗi lần lộ 1 lần). hasMore=false → ngừng gọi,
// true lại → observe lại (tải trang kế tiếp). Cleanup disconnect. Cần IO.
import { useEffect, useRef } from 'react';

export interface UseInfiniteScrollOptions {
  /** Gọi khi sentinel lộ (nạp trang kế tiếp). */
  onLoadMore: () => void;
  /** false → ngừng gọi (hết dữ liệu). Mặc định true. */
  hasMore?: boolean;
  /** rootMargin IO — mặc định '200px' (tải trước khi chạm đáy). */
  rootMargin?: string;
}

export function useInfiniteScroll<T extends Element = Element>({ onLoadMore, hasMore = true, rootMargin = '200px' }: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<T | null>(null);
  // meta qua ref → đổi callback/hasMore KHÔNG re-observe (chỉ hasMore đổi mới re-observe)
  const metaRef = useRef({ onLoadMore, hasMore });
  metaRef.current = { onLoadMore, hasMore };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined' || !hasMore) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) metaRef.current.onLoadMore();
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, rootMargin]);

  return sentinelRef;
}
