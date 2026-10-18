// Parallax — scroll-linked translateY (motion-effects W8, 0 deps): element trôi
// chậm hơn trang theo `speed` (0–1) — scroll listener rAF-throttled +
// getBoundingClientRect, offset đối xứng qua tâm viewport. Ghi style TRỰC TIẾP
// lên node (không setState — tránh re-render churn từng frame). TỰ TẮT khi
// prefers-reduced-motion (useMediaQuery) hay `disabled` → children render tĩnh.
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';

export interface ParallaxProps {
  /** Tốc độ trôi 0–1: 0 = đứng yên tương đối với viewport, 1 = trôi mạnh nhất. */
  speed?: number;
  /** Phóng nhẹ theo tiến độ trôi (ảnh hero) — scale 1 → 1 + speed × 0.15. */
  scale?: boolean;
  /** Tắt hiệu ứng (children vẫn render bình thường). */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function Parallax({ speed = 0.3, scale = false, disabled, className, children }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const active = !disabled && !reduced && speed !== 0;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // tâm element lệch bao nhiêu so với tâm viewport, chuẩn hoá về -1..1
      const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      const y = -clamped * speed * 120;
      el.style.transform = scale
        ? `translate3d(0, ${y}px, 0) scale(${1 + speed * 0.15})`
        : `translate3d(0, ${y}px, 0)`;
      el.style.willChange = 'transform';
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update(); // frame đầu — đặt vị trí ngay cả khi chưa scroll
    document.addEventListener('scroll', schedule, true); // capture: bắt scroll trong container lồng
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf); // huỷ frame chưa chạy — không touching node sau unmount
    };
  }, [active, speed, scale]);

  return (
    <div ref={ref} style={active ? undefined : ({ transform: 'none' } satisfies CSSProperties)} className={className}>
      {children}
    </div>
  );
}
