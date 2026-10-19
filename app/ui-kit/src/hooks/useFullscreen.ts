// useFullscreen — Fullscreen API trên element (ref) hoặc documentElement:
// enter/exit/toggle + isFullscreen theo fullscreenchange. Môi trường không có
// API (jsdom) → enter/exit no-op an toàn (optional chaining). Toggle tiện cho nút.
import { useEffect, useState, type RefObject } from 'react';

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
}

export function useFullscreen(target?: RefObject<HTMLElement | null>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document === 'undefined' ? false : Boolean(document.fullscreenElement),
  );

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const element = () => target?.current ?? document.documentElement;
  const enter = () => {
    const node = element();
    const result = node.requestFullscreen?.() as Promise<void> | undefined;
    result?.catch(() => undefined);
  };
  const exit = () => {
    const result = document.exitFullscreen?.() as Promise<void> | undefined;
    result?.catch(() => undefined);
  };
  const toggle = () => (document.fullscreenElement ? exit() : enter());

  return { isFullscreen, enter, exit, toggle };
}
