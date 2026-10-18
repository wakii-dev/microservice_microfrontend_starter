// Galleria — gallery CSS scroll-snap lite (hướng A — đủ gallery cơ bản, 0 deps).
// Indicator click scroll qua trackRef (trước đây document.querySelector('.snap-x')
// — query toàn document, trúng nhầm track galleria khác khi 2 gallery cùng trang).
import { useRef, useState } from 'react';

export interface GalleriaImage {
  /** Đường dẫn ảnh (bắt buộc). */
  src: string;
  /** Alt bắt buộc a11y. */
  alt: string;
  /** Chú thích dưới ảnh (text-body, căn giữa). */
  caption?: string;
}

export interface GalleriaProps {
  /** Ảnh gallery — scroll-snap ngang, indicator dưới click nhảy tới. */
  images: GalleriaImage[];
  className?: string;
}

export function Galleria({ images, className }: GalleriaProps) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  return (
    <div className={`overflow-hidden rounded-xl${className ? ` ${className}` : ''}`}>
      <div ref={trackRef} className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
        onScroll={(e) => {
          const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
          setActive(idx);
        }}>
        {images.map((img, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            <img src={img.src} alt={img.alt} className="aspect-video w-full object-cover" />
            {img.caption && <p className="p-2 text-center text-body text-ink2">{img.caption}</p>}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 py-2">
        {images.map((_, i) => (
          <button key={i} type="button" aria-label={`Ảnh ${i + 1}`} aria-current={i === active ? 'true' : undefined}
            onClick={() => { const track = trackRef.current; if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); setActive(i); }}
            className={`size-2 cursor-pointer rounded-pill border-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors ${i === active ? 'bg-accent' : 'bg-line hover:bg-ink3'}`} />
        ))}
      </div>
    </div>
  );
}
