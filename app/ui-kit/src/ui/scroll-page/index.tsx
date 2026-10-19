// ScrollPage — full-page scroll kiểu fullPage.js hiện đại, 0 deps (PO 2026-10-19):
// CSS scroll-snap (snap-y snap-mandatory + section snap-start) — KHÔNG wheel-hijack,
// tôn trọng touchpad/trackpad native mượt. IntersectionObserver (root = container)
// bắt section active = ratio cao nhất → indicator dots phải (pattern pagination:
// ô nhỏ, active accent, aria-current) + onChange(index). Keyboard ArrowUp/Down/
// PageUp/Down/Home/End → scrollIntoView (smooth; reduced-motion → auto).
// Reduced-motion: snap-mandatory → snap-none (cuộn tự do, không khóa khung).
// autoPlay (ms): slideshow tự chạy — tạm dừng khi hover/interaction, wrap vòng.
// IO local thay useIntersection (W7): hook đó là single-element state, ScrollPage
// cần "mục có ratio cao nhất trong N section" — 1 observer nhiều target phù hợp hơn.
import {
  Children,
  useEffect,
  useRef,
  useState,
  type FunctionComponent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';

export interface ScrollPageSectionProps {
  /** Nội dung màn — flex-col justify-center, min-h-screen, snap-start. */
  children: ReactNode;
  className?: string;
  id?: string;
  /** aria-label cho section (screen-reader điều hướng). */
  ariaLabel?: string;
}

// composite Section — data của cùng file (precedent DRAG_MIME/SideNav)
// eslint-disable-next-line react-refresh/only-export-components
function ScrollPageSectionBase({ children, className, id, ariaLabel }: ScrollPageSectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      data-scroll-page-section=""
      className={`relative flex min-h-screen snap-start flex-col justify-center px-[clamp(24px,5.3vw,68px)] py-16${className ? ` ${className}` : ''}`}
    >
      {children}
    </section>
  );
}

export interface ScrollPageProps {
  /** Các màn — dùng <ScrollPage.Section> (mỗi cái 1 màn snap). */
  children: ReactNode;
  /** Bắn khi section active đổi (index 0-based). */
  onChange?: (index: number) => void;
  /** Indicator dots bên phải (mặc định bật). */
  indicator?: boolean;
  /** Điều hướng bàn phím mũi tên/PageUp/Down/Home/End (mặc định bật). */
  keyboard?: boolean;
  /** Slideshow tự chạy — khoảng nghỉ giữa 2 màn (ms). Bỏ = tắt. Tạm dừng khi hover
   * hoặc khi người dùng tương tác (wheel/phím) rồi tự chạy lại. */
  autoPlay?: number;
  ariaLabel?: string;
  className?: string;
}

export interface ScrollPageComponent extends FunctionComponent<ScrollPageProps> {
  Section: FunctionComponent<ScrollPageSectionProps>;
}

// composite chính — Section gắn dưới cùng file (pattern Layout.Sider/Input.Search)
// eslint-disable-next-line react-refresh/only-export-components
function ScrollPageBase({
  children,
  onChange,
  indicator = true,
  keyboard = true,
  autoPlay,
  ariaLabel,
  className,
}: ScrollPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = Children.toArray(children).length;
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const hoveredRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // IO local: 1 observer nhiều target — active = section có ratio cao nhất.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return undefined;
    const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-scroll-page-section]'));
    if (sections.length === 0) return undefined;
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        let best = 0;
        let bestRatio = -1;
        sections.forEach((el, i) => {
          const r = ratios.get(el) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            best = i;
          }
        });
        setActive((prev) => (prev === best ? prev : best));
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [children]);

  useEffect(() => {
    onChangeRef.current?.(active);
  }, [active]);

  function scrollToSection(index: number) {
    const container = containerRef.current;
    if (!container) return;
    const sections = container.querySelectorAll<HTMLElement>('[data-scroll-page-section]');
    const target = sections[Math.max(0, Math.min(sections.length - 1, index))];
    target?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!keyboard) return;
    const map: Record<string, number> = {
      ArrowDown: active + 1,
      PageDown: active + 1,
      ArrowUp: active - 1,
      PageUp: active - 1,
      Home: 0,
      End: count - 1,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault(); // chặn cuộn native đôi — scrollIntoView snap chuẩn hơn
    scrollToSection(next);
  }

  // autoPlay slideshow — pause khi hover container hoặc reduced-motion.
  useEffect(() => {
    if (!autoPlay || autoPlay < 1 || reduced || hoveredRef.current) return undefined;
    const timer = window.setInterval(() => {
      if (hoveredRef.current) return;
      scrollToSection((active + 1) % count);
    }, autoPlay);
    return () => window.clearInterval(timer);
    // active trong deps → mỗi lần đổi màn đặt lại đồng hồ (slide giữ đủ thời gian)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, active, count, reduced]);

  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={() => {
          hoveredRef.current = true;
        }}
        onPointerUp={() => {
          hoveredRef.current = false;
        }}
        onMouseEnter={() => {
          hoveredRef.current = true;
        }}
        onMouseLeave={() => {
          hoveredRef.current = false;
        }}
        onWheel={() => {
          hoveredRef.current = true;
        }}
        onKeyDown={handleKeyDown}
        className={`h-screen overflow-y-auto bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent/40 snap-y ${
          reduced ? 'snap-none' : 'snap-mandatory'
        }${className ? ` ${className}` : ''}`}
      >
        {children}
      </div>

      {indicator && count > 0 && (
        <div className="absolute right-4 top-1/2 z-[var(--z-popover)] flex -translate-y-1/2 flex-col gap-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Đi tới màn ${i + 1}`}
              aria-current={i === active || undefined}
              onClick={() => scrollToSection(i)}
              className={`size-2 cursor-pointer rounded-sm border-none p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                i === active ? 'bg-accent' : 'bg-ink3/50 hover:bg-ink3'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** ScrollPage + Section composite (pattern Layout.Sider / Input.Search). */
export const ScrollPage = Object.assign(ScrollPageBase, { Section: ScrollPageSectionBase }) as ScrollPageComponent;
