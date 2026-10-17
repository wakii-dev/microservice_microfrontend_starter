// Galleria — gallery CSS scroll-snap lite (hướng A — đủ gallery cơ bản, 0 deps).
import { useState } from 'react';

export interface GalleriaImage { src: string; alt: string; caption?: string }

export interface GalleriaProps {
  images: GalleriaImage[];
  className?: string;
}

export function Galleria({ images, className }: GalleriaProps) {
  const [active, setActive] = useState(0);
  return (
    <div className={`overflow-hidden rounded-3${className ? ` ${className}` : ''}`}>
      <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
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
          <button key={i} type="button" aria-label={`Ảnh ${i + 1}`}
            onClick={() => { const track = document.querySelector('.snap-x'); if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); setActive(i); }}
            className={`size-2 cursor-pointer rounded-pill border-none transition-colors ${i === active ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </div>
    </div>
  );
}
