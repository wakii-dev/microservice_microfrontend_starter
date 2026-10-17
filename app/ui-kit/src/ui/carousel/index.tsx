// Carousel — slide transform + dots + autoplay (CSS scroll-snap lite).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface CarouselProps {
  items: ReactNode[];
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
}

export function Carousel({ items, autoplay = false, autoplayInterval = 4000, className }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % items.length), autoplayInterval);
    return () => clearInterval(id);
  }, [autoplay, autoplayInterval, items.length]);

  return (
    <div className={`relative overflow-hidden rounded-3${className ? ` ${className}` : ''}`}>
      <div ref={trackRef}
        className="flex transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}>
        {items.map((item, i) => (
          <div key={i} className="w-full shrink-0">{item}</div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, i) => (
            <button key={i} type="button" aria-label={`Slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`size-2 cursor-pointer rounded-pill border-none transition-colors ${i === current ? 'bg-white' : 'bg-white/40 hover:bg-white/60'}`} />
          ))}
        </div>
      )}
      <button type="button" aria-label="Trước" onClick={() => setCurrent((c) => (c - 1 + items.length) % items.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-black/30 p-1 text-white">‹</button>
      <button type="button" aria-label="Sau" onClick={() => setCurrent((c) => (c + 1) % items.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-pill border-none bg-black/30 p-1 text-white">›</button>
    </div>
  );
}
