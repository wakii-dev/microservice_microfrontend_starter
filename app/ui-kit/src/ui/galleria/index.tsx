// Galleria — gallery CSS scroll-snap lite (hướng A — đủ gallery cơ bản, 0 deps).
// Indicator click scroll qua trackRef (trước đây document.querySelector('.snap-x')
// — query toàn document, trúng nhầm track galleria khác khi 2 gallery cùng trang).
// slots-wave: classNames root/track/item/caption/indicators/indicator + style.
import classNames from 'classnames';
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';

export interface GalleriaImage {
  /** Đường dẫn ảnh (bắt buộc). */
  src: string;
  /** Alt bắt buộc a11y. */
  alt: string;
  /** Chú thích dưới ảnh (text-body, căn giữa). */
  caption?: string;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface GalleriaClassNames {
  /** Div gốc bọc track + indicators. */
  root?: string;
  /** Div track cuộn ngang (scroll-snap). */
  track?: string;
  /** Div 1 slide (img + caption). */
  item?: string;
  /** <p> chú thích dưới ảnh — chỉ render khi có caption. */
  caption?: string;
  /** Div bọc hàng indicator. */
  indicators?: string;
  /** Button chấm indicator. */
  indicator?: string;
}

export interface GalleriaProps {
  /** Ảnh gallery — scroll-snap ngang, indicator dưới click nhảy tới. */
  images: GalleriaImage[];
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: GalleriaClassNames;
}

export function Galleria(props: GalleriaProps) {
  const { images, className, style } = props;
  const slots = props.classNames;
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  return (
    <div className={classNames('overflow-hidden rounded-xl', slots?.root, className)} style={style}>
      <div
        ref={trackRef}
        className={classNames('flex overflow-x-auto snap-x snap-mandatory scroll-smooth', slots?.track)}
        onScroll={(e) => {
          const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
          setActive(idx);
        }}
      >
        {images.map((img, i) => (
          <div key={i} className={classNames('w-full shrink-0 snap-center', slots?.item)}>
            <img src={img.src} alt={img.alt} className="aspect-video w-full object-cover" />
            {img.caption && <p className={classNames('p-2 text-center text-body text-ink2', slots?.caption)}>{img.caption}</p>}
          </div>
        ))}
      </div>
      <div className={classNames('flex justify-center gap-1.5 py-2', slots?.indicators)}>
        {images.map((_, i) => (
          <button key={i} type="button" aria-label={`Ảnh ${i + 1}`} aria-current={i === active ? 'true' : undefined}
            onClick={() => { const track = trackRef.current; if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }); setActive(i); }}
            className={classNames('size-2 cursor-pointer rounded-pill border-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-colors duration-200 ease-[var(--ease-smooth)]', i === active ? 'bg-accent' : 'bg-line hover:bg-ink3', slots?.indicator)} />
        ))}
      </div>
    </div>
  );
}
