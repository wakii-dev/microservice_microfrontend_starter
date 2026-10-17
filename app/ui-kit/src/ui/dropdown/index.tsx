// Dropdown — trigger + menu overlay (antd look: menu radius 8, shadow popover,
// item h-8 px-3 hover fill-quaternary, danger = đỏ; divider giữa nhóm key '---').
// Đóng: click item / ESC / click ngoài (document listener).
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface DropdownItem {
  key: string;
  label: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  /** Trigger element (click để mở). */
  trigger: ReactNode;
  items: DropdownItem[];
  onItemClick?: (key: string) => void;
  className?: string;
}

export function Dropdown({ trigger, items, onItemClick, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <span onClick={() => setOpen((o) => !o)} className="inline-flex">
        {trigger}
      </span>
      {open && (
        <ul className="absolute right-0 z-30 mt-1 min-w-[120px] list-none rounded-3 border border-line bg-s2 p-1 shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]">
          {items.map((item) =>
            item.key === '---' ? (
              <li key={item.key} className="my-1 border-t border-line2" />
            ) : (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    onItemClick?.(item.key);
                    setOpen(false);
                  }}
                  className={`w-full cursor-pointer rounded-2 border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors ${
                    item.danger ? 'text-st-fail hover:bg-st-fail/12' : 'text-ink hover:bg-s3'
                  } ${item.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
                >
                  {item.label}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </span>
  );
}
