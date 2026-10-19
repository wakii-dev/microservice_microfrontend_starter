// useTitle — đặt document.title khi `title` đổi; restoreOnUnmount trả về title
// TRƯỚC hook mount khi unmount (tiện trang tạm/redirect). SSR-safe.
import { useEffect, useRef } from 'react';

export function useTitle(title: string, restoreOnUnmount = false) {
  const prevTitleRef = useRef(typeof document === 'undefined' ? '' : document.title);

  useEffect(() => {
    const prev = prevTitleRef.current; // chốt giá trị lúc effect chạy — cleanup dùng bản chốt
    document.title = title;
    return () => {
      if (restoreOnUnmount) document.title = prev;
    };
  }, [title, restoreOnUnmount]);
}
