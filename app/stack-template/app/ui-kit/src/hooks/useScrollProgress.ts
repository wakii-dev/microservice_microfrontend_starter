// useScrollProgress — tiến độ scroll toàn trang 0..1 (0 = đầu trang, 1 = đáy),
// rAF-throttle + passive listener (pattern Parallax/usePageProgress trong
// templates). Dùng cho progress bar top, "đọc % bài viết", reveal theo depth.
import { useEffect, useState } from 'react';

/** Tiến độ scroll document hiện tại — `0..1` (clamp; trang ngắn hơn viewport = 0). */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update(); // frame đầu — đúng vị trí hiện tại cả khi chưa scroll
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}
