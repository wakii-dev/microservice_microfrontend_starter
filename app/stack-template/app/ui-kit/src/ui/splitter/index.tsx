// Splitter — drag resize 2 panels (hướng A custom hook, 0 deps).
import { useCallback, useRef, useState, type ReactNode } from 'react';

export interface SplitterProps {
  /** Panel trái/trên. */
  first: ReactNode;
  /** Panel phải/dưới. */
  second: ReactNode;
  direction?: 'horizontal' | 'vertical';
  /** % panel đầu (mặc định 50). */
  defaultSize?: number;
  className?: string;
}

export function Splitter({ first, second, direction = 'horizontal', defaultSize = 50, className }: SplitterProps) {
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
    <div ref={containerRef} className={`flex ${isH ? 'flex-row' : 'flex-col'} ${className ?? ''}`}>
      <div style={isH ? { width: `${size}%` } : { height: `${size}%` }} className="overflow-auto">
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={isH ? 'vertical' : 'horizontal'}
        onMouseDown={onDrag}
        className={isH ? 'w-1 cursor-col-resize bg-line transition-colors hover:bg-accent' : 'h-1 cursor-row-resize bg-line transition-colors hover:bg-accent'}
      />
      <div className="flex-1 overflow-auto">{second}</div>
    </div>
  );
}
