// ContextMenu — right-click menu (position theo mouse).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface ContextMenuItem { key: string; label: ReactNode; danger?: boolean; disabled?: boolean }

export interface ContextMenuProps {
  items: ContextMenuItem[];
  children: ReactNode;
  onItemClick?: (key: string) => void;
  className?: string;
}

export function ContextMenu({ items, children, onItemClick, className }: ContextMenuProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPos(null); };
    document.addEventListener('click', close);
    document.addEventListener('contextmenu', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', close); document.removeEventListener('contextmenu', close); document.removeEventListener('keydown', onKey); };
  }, [pos]);
  return (
    <div ref={ref} className={className} onContextMenu={(e) => { e.preventDefault(); setPos({ x: e.clientX, y: e.clientY }); }}>
      {children}
      {pos && (
        <ul role="menu" className="fixed z-[var(--z-dropdown)] m-0 min-w-[160px] list-none rounded-3 border border-line bg-s2 p-1 shadow-[var(--shadow-pop)]" style={{ left: pos.x, top: pos.y }}>
          {items.map((item) => item.key === '---' ? (
            <li key={item.key} className="my-1 border-t border-line2" />
          ) : (
            <li key={item.key}>
              <button type="button" disabled={item.disabled} onClick={() => { onItemClick?.(item.key); setPos(null); }}
                className={`w-full cursor-pointer rounded-2 border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors ${item.danger ? 'text-st-fail hover:bg-st-fail/12' : 'text-ink hover:bg-s3'} ${item.disabled ? 'cursor-not-allowed text-ink3' : ''}`}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
