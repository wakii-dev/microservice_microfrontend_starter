// useTitle — set document.title theo props (pattern usehooks.com): đổi `title`
// là tab đổi tên; mặc định KHÔI PHỤC title cũ khi unmount (option tắt được —
// kiểu trang muốn "giữ" tiêu đề sau khi rời). Chain restore đúng: mỗi cleanup
// trả lại title TRƯỚC lần set của effect đó → unmount lùi về title gốc mount.
import { useEffect } from 'react';

export interface UseTitleOptions {
  /** Khôi phục title trước đó khi unmount — mặc định true. */
  restoreOnUnmount?: boolean;
}

/** Đồng bộ document.title với `title`; unmount trả lại title cũ (mặc định). */
export function useTitle(title: string, options: UseTitleOptions = {}): void {
  const { restoreOnUnmount = true } = options;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previous = document.title;
    document.title = title;
    return () => {
      if (restoreOnUnmount) document.title = previous;
    };
  }, [title, restoreOnUnmount]);
}
