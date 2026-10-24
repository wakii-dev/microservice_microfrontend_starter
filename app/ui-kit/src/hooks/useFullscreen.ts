// useFullscreen — toàn màn hình cho 1 element (Fullscreen API, pattern
// usehooks.com): ref (hoặc `target` option) + isFullscreen theo event
// `fullscreenchange` của document + enter/exit/toggle. Fallback an toàn: môi
// trường thiếu API (jsdom/SSR/browser chặn) → enter/exit no-op, state vẫn
// phản ánh document.fullscreenElement thật — không crash, không promise reject
// lơ lửng (catch nuốt lỗi trình duyệt từ chối không có user gesture).
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface UseFullscreenOptions {
  /** Element cố định cần fullscreen — không truyền thì gắn `ref` trả về. */
  target?: RefObject<HTMLElement | null>;
  /** Bắn mỗi lần trạng thái đổi (theo event fullscreenchange). */
  onChange?: (isFullscreen: boolean) => void;
}

export interface UseFullscreenReturn {
  /** Gắn lên element muốn fullscreen (bỏ qua nếu đã dùng `target`). */
  ref: RefObject<HTMLDivElement | null>;
  /** true khi element đang fullscreen (đọc document.fullscreenElement). */
  isFullscreen: boolean;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
}

/** Toàn màn hình cho element — state sync qua fullscreenchange (kể cả ESC). */
export function useFullscreen(options: UseFullscreenOptions = {}): UseFullscreenReturn {
  const { target, onChange } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && document.fullscreenElement != null,
  );
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sync = () => {
      const active = document.fullscreenElement != null;
      setIsFullscreen(active);
      onChangeRef.current?.(active);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const resolveEl = () => target?.current ?? ref.current;

  // Fallback: API không tồn tại (jsdom/SSR) → no-op; promise reject (browser
  // yêu cầu user gesture) → catch nuốt, state chờ fullscreenchange quyết định.
  const enter = useCallback(() => {
    const el = resolveEl() ?? document.documentElement;
    const request = (el as HTMLElement & { requestFullscreen?: () => Promise<void> }).requestFullscreen?.bind(el);
    request?.().catch(() => {});
  }, [target]);

  const exit = useCallback(() => {
    const exitFn = (document as Document & { exitFullscreen?: () => Promise<void> }).exitFullscreen?.bind(document);
    exitFn?.().catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { ref, isFullscreen, enter, exit, toggle };
}
