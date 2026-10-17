// useMediaQuery — boolean theo CSS media query, cập nhật realtime khi viewport/thay đổi hệ thống, pattern usehooks.com/ui.dev.
// JSdom thiếu matchMedia — tests/stories cần mock (xem useMediaQuery.test.ts).
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches); // đồng bộ lại khi query đổi giữa các render
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
