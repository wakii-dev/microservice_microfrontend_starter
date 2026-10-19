// useEventListener — gắn event listener khai báo kiểu + dọn dẹp sạch khi đổi
// target/event/unmount. Handler lưu qua ref → đổi callback KHÔNG re-bind.
// Target: RefObject element (ref.current null → không gắn, tự thử lại khi ref
// đổi), hoặc Window/Document/Element. Mặc định window. Pattern usehooks.com.
import { useEffect, useRef, type RefObject } from 'react';

export type EventListenerTarget = RefObject<Element | null> | Window | Document | Element | null;

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  target: EventListenerTarget = null,
  options?: AddEventListenerOptions,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // null/undefined → WINDOW mặc định; RefObject current null → chưa mount, bỏ qua
    const el: EventTarget | null =
      target == null ? window : 'current' in target ? ((target.current as EventTarget | null) ?? null) : (target as EventTarget);
    if (!el) return undefined;
    const listener = (event: Event) => handlerRef.current(event as WindowEventMap[K]);
    el.addEventListener(eventName, listener, options);
    return () => el.removeEventListener(eventName, listener, options);
    // options serialize để so sánh (AddEventListenerOptions object mới mỗi render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, target, JSON.stringify(options ?? null)]);
}
