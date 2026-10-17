// useClickAway — kích hoạt handler khi mousedown/touchstart RA KHỎI element, pattern usehooks.com/ui.dev.
// Trả về ref để gắn lên phần tử "bên trong" (dropdown/popover). Handler qua ref → không re-bind listener.
import { useEffect, useRef } from 'react';

type ClickAwayEvent = MouseEvent | TouchEvent;

export function useClickAway<T extends HTMLElement>(handler: (event: ClickAwayEvent) => void) {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event: ClickAwayEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return; // click bên trong → bỏ qua
      handlerRef.current(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, []);

  return ref;
}
