// scroll-mood — engine dùng chung Templates/Cinematic Experience (owner @v2).
// Cung cấp: usePageProgress (0..1 toàn trang) · useSectionProgress (0..1 section
// qua viewport) · CrossfadeBackdrop (nền 3 layer theo mood) · SectionMood (wrapper
// chương đặt id + data-mood + --mood-progress). Mọi chapter import TỪ FILE NÀY —
// không tự viết scroll listener (contract EXPERIENCE-DESIGN.md mục 4).
/* eslint-disable react-refresh/only-export-components -- engine cố ý gộp hooks + components cùng hệ mood; tách file chỉ để tắt warning fast-refresh */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** Progress scroll toàn trang 0..1 (rAF-throttle, 1 listener). */
export function usePageProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setPct(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return pct;
}

/** Progress 0..1 của section đi qua viewport (rAF — pattern Parallax W8). */
export function useSectionProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setProgress(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return { ref, progress };
}

/** Nền crossfade mood v0.3 theo REF-SPEC — hero SÁNG (canvas) → chapters GIỮA TỐI
 * (--scrim-4 vũ trụ, khớp khối chương tự chủ tối) → CTA SÁNG (canvas) cuối trang. */
export function CrossfadeBackdrop({ pct }: { pct: number }) {
  const canvasOpacity = pct < 0.5 ? 1 - pct * 2 : 0;
  const scrimOpacity = pct < 0.5 ? pct * 2 : 2 - pct * 2;
  const endCanvasOpacity = pct > 0.5 ? (pct - 0.5) * 2 : 0;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-canvas" style={{ opacity: canvasOpacity }} />
      <div className="absolute inset-0 bg-[var(--scrim-4)]" style={{ opacity: scrimOpacity }} />
      <div className="absolute inset-0 bg-canvas" style={{ opacity: endCanvasOpacity }} />
    </div>
  );
}

/** Wrapper chương — đặt id + data-mood + --mood-progress (contract EXPERIENCE-DESIGN mục 2-3). */
export function SectionMood({
  id,
  mood,
  className = 'relative min-h-screen',
  style,
  children,
}: {
  id: string;
  mood: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section id={id} data-mood={mood} className={className} style={style}>
      {children}
    </section>
  );
}
