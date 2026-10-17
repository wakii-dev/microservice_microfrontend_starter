// useLockBodyScroll — khoá scroll của <body> (modal/drawer mở), pattern usehooks.com/ui.dev.
// useLayoutEffect để khoá TRƯỚC khi browser paint — không nhấp nháy scroll; cleanup luôn restore.
import { useLayoutEffect } from 'react';

export function useLockBodyScroll(locked = true): void {
  useLayoutEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (locked) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow; // restore kể cả khi đổi locked hay unmount
    };
  }, [locked]);
}
