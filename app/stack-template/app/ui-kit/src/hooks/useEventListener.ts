// useEventListener — gắn event listener khai báo kiểu React (pattern usehooks.com):
// - handler nằm trong ref → KHÔNG re-attach khi caller truyền inline function
// - target: window (mặc định) / document / element / RefObject — đổi target tự dọn cũ
// - auto cleanup khi unmount. SSR an toàn (effect chỉ chạy client).
import { useEffect, useRef, type RefObject } from 'react';

/** Đích gắn listener — element trực tiếp hoặc ref (resolve trong effect). */
export type EventListenerTarget = Window | Document | HTMLElement | RefObject<HTMLElement | null>;

/** Gắn `eventName` lên `target` với handler luôn mới (không re-attach). */
export function useEventListener(eventName: string, handler: (event: Event) => void, target: EventListenerTarget = window): void {
  // Ref giữ handler mới nhất — listener gắn đúng 1 lần mỗi (eventName, target).
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // RefObject → .current (có thể null lúc đầu — bỏ qua đến khi có element)
    const resolved: Window | Document | HTMLElement | null =
      target && typeof (target as RefObject<HTMLElement | null>).current !== 'undefined' && !(target instanceof Window) && !(target instanceof Document) && !(target instanceof HTMLElement)
        ? (target as RefObject<HTMLElement | null>).current
        : (target as Window | Document | HTMLElement);
    if (!resolved || !('addEventListener' in resolved)) return;

    const listener = (event: Event) => handlerRef.current(event);
    resolved.addEventListener(eventName, listener);
    return () => resolved.removeEventListener(eventName, listener);
  }, [eventName, target]);
}
