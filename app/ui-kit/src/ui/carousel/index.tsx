import type { ReactNode } from 'react';
// Carousel — PrimeReact-level: circular, autoplay + pauseOnHover, indicators,
// prev/next navigators, responsive itemsPerView, vertical, motion easing.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface CarouselProps {
  items: ReactNode[];
  /** Vô hạn — loop về đầu/cuối. */
  circular?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  pauseOnHover?: boolean;
  /** Số items hiển thị mỗi view. */
  itemsPerView?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Carousel({
  items, circular = false, autoplay = false, autoplayInterval = 4000,
  pauseOnHover = false, itemsPerView = 1, orientation = 'horizontal', className,
}: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const maxIndex = Math.max(0, items.length - itemsPerView);
  const isVertical = orientation === 'vertical';

  const next = useCallback(() => {
    setCurrent((c) => {
      if (c + itemsPerView >= items.length) return circular ? 0 : maxIndex;
      return Math.min(maxIndex, c + 1);
    });
  }, [circular, itemsPerView, items.length, maxIndex]);

  const prev = useCallback(() => {
    setCurrent((c) => {
      if (c === 0) return circular ? maxIndex : 0;
      return Math.max(0, c - 1);
    });
  }, [circular, maxIndex]);

  useEffect(() => {
    if (!autoplay || isHovering || items.length <= 1) return;
    const id = setInterval(next, autoplayInterval);
    return () => clearInterval(id);
  }, [autoplay, autoplayInterval, isHovering, next, items.length]);

  const translatePct = (current / Math.max(1, items.length)) * 100;
  const itemW = `${100 / itemsPerView}%`;

  return (
    <div
      className={`relative overflow-hidden${className ? ` ${className}` : ''}`}
      onMouseEnter={() => pauseOnHover && setIsHovering(true)}
      onMouseLeave={() => pauseOnHover && setIsHovering(false)}
    >
      <div
        className={`flex transition-transform duration-[var(--motion-slow)] ease-[cubic-bezier(0.16,1,0.3,1)] ${isVertical ? 'flex-col' : 'flex-row'}`}
        style={{
          transform: isVertical
            ? `translateY(-${translatePct}%)`
            : `translateX(-${translatePct}%)`,
        }}
      >
        {items.map((item, i) => (
          <div key={i} className={isVertical ? 'w-full' : 'shrink-0'} style={!isVertical ? { width: itemW } : undefined}>
            {item}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className={`absolute ${isVertical ? 'right-2 top-1/2 -translate-y-1/2 flex-col' : 'bottom-3 left-1/2 -translate-x-1/2 flex-row'} flex gap-1.5`}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`size-2 cursor-pointer rounded-pill border-none transition-colors ${i === current ? 'bg-accent' : 'bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)]'}`}
            />
          ))}
        </div>
      )}

      {/* Navigators */}
      <button
        type="button"
        aria-label="Trước"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-[rgba(0,0,0,0.3)] p-1.5 text-white transition-colors hover:bg-[rgba(0,0,0,0.5)]"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Sau"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-[rgba(0,0,0,0.3)] p-1.5 text-white transition-colors hover:bg-[rgba(0,0,0,0.5)]"
      >
        ›
      </button>
    </div>
  );
}
