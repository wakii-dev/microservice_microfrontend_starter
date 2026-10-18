// Dropdown — trigger + menu overlay (antd look: menu radius 8, shadow popover,
// item h-8 px-3 hover fill-quaternary, danger = đỏ; divider giữa nhóm key '---').
// Đóng: click item / ESC / click ngoài (document listener).
// A11y (batch ⑫ worker C): role=menu/menuitem, ArrowUp/Down/Home/End đi giữa
// item, mở bằng keyboard (Enter/Space/ArrowDown) → focus item đầu, ESC → đóng
// + trả focus về trigger.
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

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
  const menuRef = useRef<HTMLUListElement>(null);
  // Mở bằng keyboard (Enter/Space/ArrowDown) → focus item đầu sau khi mở
  const focusFirstOnOpen = useRef(false);

  const itemButtons = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])') ?? [],
    );

  useEffect(() => {
    if (!open) return;
    if (focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      itemButtons()[0]?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        // trả focus về trigger (phần tử focusable đầu trong root)
        rootRef.current
          ?.querySelector<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
          ?.focus();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Trigger mở bằng keyboard: ArrowDown mở + focus item đầu với MỌI trigger;
  // Enter/Space với native button → click sự kiện detail=0 (keyboard) → flag trước.
  const onTriggerKey = (e: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusFirstOnOpen.current = true;
      setOpen(true);
    }
  };
  const onTriggerClick = (e: React.MouseEvent) => {
    // click sinh từ bàn phím (Enter/Space trên native button) có detail = 0
    if (e.detail === 0) focusFirstOnOpen.current = true;
    setOpen((o) => !o);
  };

  // Menu keyboard: ArrowUp/Down vòng tròn, Home/End đầu/cuối (bỏ item disabled)
  const onMenuKey = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const buttons = itemButtons();
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

  return (
    <span ref={rootRef} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <span onClick={onTriggerClick} onKeyDown={onTriggerKey} className="inline-flex">
        {trigger}
      </span>
      {open && (
        <ul
          ref={menuRef}
          role="menu"
          onKeyDown={onMenuKey}
          className="absolute right-0 z-30 mt-1 min-w-[120px] list-none rounded-3 border border-line bg-s2 p-1 shadow-[0_6px_16px_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]"
        >
          {items.map((item) =>
            item.key === '---' ? (
              <li key={item.key} className="my-1 border-t border-line2" />
            ) : (
              <li key={item.key}>
                <button
                  type="button"
                  role="menuitem"
                  aria-disabled={item.disabled || undefined}
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
