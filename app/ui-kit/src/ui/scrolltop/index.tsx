// ScrollTop — nút quay đầu trang (hiện khi scrollY > threshold).
// slots-wave: classNames {root} + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import { useEffect, useState, type CSSProperties } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface ScrollTopClassNames {
  /** Button fixed góc phải-dưới. */
  root?: string;
}

export interface ScrollTopProps {
  threshold?: number;
  className?: string;
  /** Inline style — passthrough lên button. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: ScrollTopClassNames;
}

export function ScrollTop(props: ScrollTopProps) {
  const { threshold = 400, className, style } = props;
  const slots = props.classNames;
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
      className={classNames(
        'fixed bottom-6 right-6 z-[var(--z-toast)] grid size-10 cursor-pointer place-items-center rounded-pill border-none bg-accent text-body text-white shadow-[var(--shadow-pop)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        slots?.root,
        className,
      )}
      style={style}
    >
      ↑
    </button>
  );
}
