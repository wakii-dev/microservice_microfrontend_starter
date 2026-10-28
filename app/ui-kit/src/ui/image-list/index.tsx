// ImageList — MUI-parity gallery. standard = fixed-rowHeight CSS grid (crops, tidy);
// masonry = CSS columns (MUI-identical mechanics; visual order runs top-to-bottom per
// column — documented caveat; gap applies horizontally via column-gap, vertical rhythm
// is a fixed mb-2). Tiles are keyboard-activatable when onItemClick is set.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface ImageListItem {
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageListClassNames {
  root?: string;
  item?: string;
  image?: string;
  caption?: string;
}

export interface ImageListProps {
  items: ImageListItem[];
  cols?: number;
  /** px gap — grid gap (standard) / column-gap (masonry; vertical rhythm stays mb-2). */
  gap?: number;
  variant?: 'standard' | 'masonry';
  /** Fixed tile image height (standard variant only; masonry keeps natural height). */
  rowHeight?: number;
  onItemClick?: (index: number) => void;
  renderItem?: (item: ImageListItem, index: number) => ReactNode;
  className?: string;
  style?: CSSProperties;
  classNames?: ImageListClassNames;
}

export function ImageList(props: ImageListProps) {
  const { items, cols = 3, gap = 8, variant = 'standard', rowHeight = 160, onItemClick, renderItem, className, style } = props;
  const slots = props.classNames;
  const rootStyle: CSSProperties =
    variant === 'masonry'
      ? { columnCount: cols, columnGap: `${gap}px`, ...style }
      : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${gap}px`, ...style };

  return (
    <div
      className={classNames(variant === 'masonry' ? '' : 'grid', slots?.root, className)}
      style={rootStyle}
    >
      {items.map((item, i) =>
        renderItem ? (
          renderItem(item, i)
        ) : (
          <figure
            key={`${item.src}-${i}`}
            tabIndex={onItemClick ? 0 : undefined}
            role={onItemClick ? 'button' : undefined}
            aria-label={onItemClick ? item.caption ?? item.alt : undefined}
            onKeyDown={
              onItemClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onItemClick(i);
                    }
                  }
                : undefined
            }
            onClick={onItemClick ? () => onItemClick(i) : undefined}
            className={classNames(
              'm-0',
              variant === 'masonry' && 'mb-2 break-inside-avoid',
              onItemClick && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
              slots?.item,
            )}
          >
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className={classNames('w-full object-cover', slots?.image)}
              style={variant === 'standard' ? { height: `${rowHeight}px` } : undefined}
            />
            {item.caption && (
              <figcaption className={classNames('mt-1 text-label text-ink2', slots?.caption)}>{item.caption}</figcaption>
            )}
          </figure>
        ),
      )}
    </div>
  );
}
