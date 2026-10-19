// ContextMenu — right-click menu (position theo mouse).
// A11y: role=menu/menuitem, ArrowUp/Down/Home/End đi giữa item (pattern dropdown),
// ESC/click ngoài đóng.
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

export interface ContextMenuItem {
  /** Khóa định danh — '---' render divider. */
  key: string;
  label: ReactNode;
  /** Item đỏ (hành động phá hủy). */
  danger?: boolean;
  disabled?: boolean;
}

export interface ContextMenuProps {
  /** Item menu — key '---' render divider. */
  items: ContextMenuItem[];
  /** Vùng bắt right-click. */
  children: ReactNode;
  /** Callback khi chọn item. */
  onItemClick?: (key: string) => void;
  className?: string;
}

export function ContextMenu({ items, children, onItemClick, className }: ContextMenuProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Menu keyboard: ArrowUp/Down vòng tròn, Home/End đầu/cuối (bỏ item disabled)
  const onMenuKey = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])') ?? [],
    );
    if (buttons.length === 0) return;
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      buttons[(idx + 1) % buttons.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      buttons[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      buttons[buttons.length - 1].focus();
    }
  };
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
        <ul ref={menuRef} role="menu" onKeyDown={onMenuKey} className="fixed z-[var(--z-dropdown)] m-0 w-max min-w-[180px] max-w-[calc(100vw-16px)] origin-top-left list-none rounded-xl border border-line bg-s2 [background-image:var(--wash)] p-1 shadow-[var(--ele-3),var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-smooth)]" style={{ left: pos.x, top: pos.y }}>
          {items.map((item) => item.key === '---' ? (
            <li key={item.key} className="my-1 border-t border-line2" />
          ) : (
            <li key={item.key}>
              <button type="button" role="menuitem" aria-disabled={item.disabled || undefined} disabled={item.disabled} onClick={() => { onItemClick?.(item.key); setPos(null); }}
                className={`w-full cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors duration-[240ms] ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${item.danger ? 'text-st-fail hover:bg-st-fail/12 active:bg-st-fail/12' : 'text-ink hover:bg-s3 active:bg-s3'} ${item.disabled ? 'cursor-not-allowed text-ink3' : ''}`}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
