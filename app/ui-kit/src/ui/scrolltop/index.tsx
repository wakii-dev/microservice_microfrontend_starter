// ScrollTop — nút quay đầu trang (hiện khi scrollY > threshold).
import { useEffect, useState } from 'react';

export interface ScrollTopProps {
  threshold?: number;
  className?: string;
}

export function ScrollTop({ threshold = 400, className }: ScrollTopProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [threshold]);
  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label="Về đầu trang"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-[var(--z-toast)] grid size-10 cursor-pointer place-items-center rounded-pill border-none bg-accent text-body text-white shadow-[var(--shadow-pop)] transition-opacity hover:opacity-90${className ? ` ${className}` : ''}`}
    >
      ↑
    </button>
  );
}
