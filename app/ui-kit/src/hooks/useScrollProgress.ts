// useScrollProgress — tiến độ cuộn 0..1: mặc định WINDOW (scrollY/max), truyền
// ref element → scrollTop/(scrollHeight−clientHeight). Listener scroll CAPTURE
// trên document (nhìn thấy scroll của element lồng nhau — element scroll không
// bubble), rAF-throttle, cleanup. Idiom lib/scroll-mood (experience).
import { useEffect, useState, type RefObject } from 'react';

export function useScrollProgress(target?: RefObject<HTMLElement | null> | null): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = target?.current;
      if (el) {
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
        return;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target]);

  return progress;
}
