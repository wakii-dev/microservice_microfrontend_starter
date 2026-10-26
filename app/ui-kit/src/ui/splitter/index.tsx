// Splitter — drag resize 2 panels (hướng A custom hook, 0 deps).
// slots-wave: classNames root/first/divider/second + style passthrough.
import classNames from 'classnames';
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface SplitterClassNames {
  /** Div gốc flex. */
  root?: string;
  /** Div panel đầu (% size). */
  first?: string;
  /** Div separator kéo resize. */
  divider?: string;
  /** Div panel sau (flex-1). */
  second?: string;
}

export interface SplitterProps {
  /** Panel trái/trên. */
  first: ReactNode;
  /** Panel phải/dưới. */
  second: ReactNode;
  direction?: 'horizontal' | 'vertical';
  /** % panel đầu (mặc định 50). */
  defaultSize?: number;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: SplitterClassNames;
}

export function Splitter(props: SplitterProps) {
  const { first, second, direction = 'horizontal', defaultSize = 50, className, style } = props;
  const slots = props.classNames;
  const [size, setSize] = useState(defaultSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const isH = direction === 'horizontal';

  const onDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const onMove = (me: MouseEvent) => {
      const pct = isH
        ? ((me.clientX - rect.left) / rect.width) * 100
        : ((me.clientY - rect.top) / rect.height) * 100;
      setSize(Math.min(90, Math.max(10, pct)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [isH]);

  return (
    <div ref={containerRef} className={classNames('flex', isH ? 'flex-row' : 'flex-col', slots?.root, className)} style={style}>
      <div style={isH ? { width: `${size}%` } : { height: `${size}%` }} className={classNames('overflow-auto', slots?.first)}>
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={isH ? 'vertical' : 'horizontal'}
        onMouseDown={onDrag}
        className={classNames(
          isH ? 'w-1 cursor-col-resize bg-line transition-colors hover:bg-accent' : 'h-1 cursor-row-resize bg-line transition-colors hover:bg-accent',
          slots?.divider,
        )}
      />
      <div className={classNames('flex-1 overflow-auto', slots?.second)}>{second}</div>
    </div>
  );
}
