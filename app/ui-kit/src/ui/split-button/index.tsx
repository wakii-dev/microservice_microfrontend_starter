// SplitButton — primary action + dropdown secondary (antd Dropdown.Button).
// Batch ⑱ chuẩn hoá theo design system: trigger phụ = Icon chevron-down xoay
// 180° khi open (transition); menu đóng qua useClickAway (ref container) + ESC
// (useKeyPress); ArrowDown mở + focus item đầu; motion bp-zoom-in origin-top-left
// (--motion-fast); a11y role menu/menuitem + aria-haspopup='menu' + aria-expanded;
// z-token --z-dropdown thay z-30 hardcode. Items: icon + danger + separator.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../button/index';
import type { ButtonType } from '../button/index';
import { Icon } from '../icons/index.js';
import { useClickAway } from '../../hooks/useClickAway.js';
import { useKeyPress } from '../../hooks/useKeyPress.js';

export interface SplitButtonItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  /** Render thành đường phân cách (border-t) thay vì item bấm được. */
  separator?: boolean;
}

export interface SplitButtonProps {
  label: string;
  type?: ButtonType;
  danger?: boolean;
  items: SplitButtonItem[];
  onClick?: () => void;
  onItemClick?: (key: string) => void;
  className?: string;
}

const ITEM_NORMAL =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body text-ink transition-colors hover:bg-s3';
const ITEM_DANGER =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body text-st-fail transition-colors hover:bg-st-fail/12';

export function SplitButton({ label, type = 'primary', danger, items, onClick, onItemClick, className }: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useClickAway<HTMLSpanElement>(() => setOpen(false));
  const menuRef = useRef<HTMLUListElement>(null);
  const focusFirstOnOpen = useRef(false);

  // ESC đóng menu — handler qua ref, chỉ hiệu lực khi open (setState no-op khi đóng).
  useKeyPress('Escape', () => setOpen(false));

  // Mở bằng keyboard (ArrowDown) → focus item đầu tiên.
  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.focus();
      focusFirstOnOpen.current = false;
    }
  }, [open]);

  return (
    <span ref={containerRef} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <Button type={type} danger={danger} className="rounded-r-none" onClick={onClick}>
        {label}
      </Button>
      <Button
        type={type}
        danger={danger}
        aria-label="Thêm tuỳ chọn"
        aria-haspopup="menu"
        aria-expanded={open}
        className="-ml-px rounded-l-none px-1.5"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            focusFirstOnOpen.current = true;
            setOpen(true);
          }
        }}
      >
        <span aria-hidden="true" className={`inline-flex transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <Icon name="chevron-down" size={14} />
        </span>
      </Button>
      {open && (
        <ul
          ref={menuRef}
          role="menu"
          aria-label={label}
          className="absolute left-0 top-full z-[var(--z-dropdown)] m-0 mt-1 min-w-[140px] list-none origin-top-left rounded-lg border border-line bg-s2 p-1 shadow-[var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]"
        >
          {items.map((item) =>
            item.separator ? (
              <li key={item.key} role="none" className="my-1 border-t border-line" />
            ) : (
              <li key={item.key} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onItemClick?.(item.key);
                    setOpen(false);
                  }}
                  className={item.danger ? ITEM_DANGER : ITEM_NORMAL}
                >
                  {item.icon && (
                    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
                      {item.icon}
                    </span>
                  )}
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
