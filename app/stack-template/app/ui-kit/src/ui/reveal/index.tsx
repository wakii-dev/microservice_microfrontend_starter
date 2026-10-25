// Reveal — hiện dần khi vào viewport (motion-effects W8, 0 deps):
// IntersectionObserver thêm class animate CÓ SẴN — direction=up dùng
// bp-slide-up-in, các hướng khác bp-fade-in + transition transform riêng
// (KHÔNG tạo keyframe mới). once (mặc định) chỉ reveal lần đầu; once=false →
// ẩn lại khi rời viewport. Delay dùng animation-delay + fill backwards nên
// element vẫn ẩn trong lúc trễ. prefers-reduced-motion tự tắt nhờ block global.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type RevealDirection = 'up' | 'down' | 'left' | 'right';

export interface RevealProps {
  /** Cạnh element trôi vào từ: up = từ dưới (slide-up-in) · down/left/right = fade + transition. */
  direction?: RevealDirection;
  /** Trễ ms trước khi animate (animation/transition delay). */
  delay?: number;
  /** Chỉ reveal lần đầu (mặc định true); false → ẩn lại khi rời viewport. */
  once?: boolean;
  /** RootMargin IntersectionObserver (vd '0px 0px -80px 0px' — trigger muộn hơn). */
  rootMargin?: string;
  className?: string;
  children: ReactNode;
}

/** Offset ẩn ban đầu theo hướng (up đi bằng keyframe nên chỉ cần opacity). */
const HIDDEN_OFFSET: Record<RevealDirection, string> = {
  up: 'none',
  down: 'translateY(-12px)',
  left: 'translateX(-12px)',
  right: 'translateX(12px)',
};

export function Reveal({ direction = 'up', delay = 0, once = true, rootMargin, className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Không IO (SSR/môi trường lạ) → hiện luôn, không kẹt trạng thái ẩn
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { rootMargin: rootMargin ?? undefined },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin]);

  const delayCss = `${delay}ms`;
  // fill `backwards`: trong khoảng delay element giữ keyframe "from" (opacity 0)
  const anim = shown
    ? direction === 'up'
      ? 'animate-[bp-slide-up-in_var(--motion-base)_var(--ease-enter)_backwards]'
      : 'animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)_backwards]'
    : '';
  const style: CSSProperties = shown
    ? {
        animationDelay: delayCss,
        transform: 'none',
        // down/left/right: opacity do keyframe, offset do transition transform
        transition: direction === 'up' ? undefined : `transform var(--motion-base) var(--ease-enter) ${delayCss}`,
      }
    : { transform: HIDDEN_OFFSET[direction] };

  // ẩn = opacity-0; hiện = gỡ opacity-0 (sau animation computed opacity = 1)
  const cls = `${shown ? anim : 'opacity-0'}${className ? ` ${className}` : ''}`;
  return (
    <div ref={ref} style={style} className={cls}>
      {children}
    </div>
  );
}
