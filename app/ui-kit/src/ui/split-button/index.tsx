// SplitButton — MỘT <button> duy nhất (user: "chỉ nên dùng 1 button thôi"):
// label + chevron cùng nằm trong MỘT phần tử nút — không thể "lộ chỗ nối" vì
// không có chỗ nối. Chevron là span vùng-click riêng (stopPropagation) mở menu;
// bấm phần còn lại = action chính. Keyboard: Enter/Space = action chính,
// ArrowDown = mở menu + focus item đầu. Menu/click-away/ESC/a11y giữ từ batch trước.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ButtonSize, ButtonType } from '../button/index';
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
  /** antd size — đồng bộ Button: small h-8 / middle h-9 (mặc định) / large h-10. */
  size?: ButtonSize;
  items: SplitButtonItem[];
  onClick?: () => void;
  onItemClick?: (key: string) => void;
  className?: string;
}

/** Chiều cao đồng步 Button; chevron zone thêm px bên phải bên trong CÙNG nút. */
const SIZE: Record<ButtonSize, string> = {
  small: 'h-8 px-3 text-label',
  middle: 'h-9 px-4 text-body',
  large: 'h-10 px-5 text-body',
};

const ITEM_NORMAL =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body text-ink transition-colors hover:bg-s3';
const ITEM_DANGER =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body text-st-fail transition-colors hover:bg-st-fail/12';

export function SplitButton({
  label,
  type = 'primary',
  danger,
  size = 'middle',
  items,
  onClick,
  onItemClick,
  className,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useClickAway<HTMLSpanElement>(() => setOpen(false));
  const menuRef = useRef<HTMLUListElement>(null);
  const focusFirstOnOpen = useRef(false);

  // ESC đóng menu (setState no-op khi đóng).
  useKeyPress('Escape', () => setOpen(false));

  // Mở bằng keyboard (ArrowDown) → focus item đầu tiên.
  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.focus();
      focusFirstOnOpen.current = false;
    }
  }, [open]);

  const solid = type === 'primary';
  const shellBorder = solid
    ? danger
      ? 'border-st-fail'
      : 'border-accent'
    : type === 'text'
      ? 'border-transparent'
      : 'border-line';
  const mainCls = solid
    ? danger
      ? 'bg-st-fail text-white hover:bg-[#ff7875]'
      : 'bg-accent text-white hover:bg-accent-hi'
    : type === 'text'
      ? danger
        ? 'bg-transparent text-st-fail hover:bg-st-fail/12'
        : 'bg-transparent text-ink hover:bg-s3'
      : 'bg-s2 text-ink hover:bg-s3';

  return (
    <span ref={containerRef} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onClick?.()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            focusFirstOnOpen.current = true;
            setOpen(true);
          }
        }}
        className={`inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border ${shellBorder} ${SIZE[size]} ${mainCls} border-0 font-medium tracking-[0.01em] outline-none transition-all duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-lift)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`}
      >
        {label}
        {/* Vùng chevron: span click riêng BÊN TRONG nút — stopPropagation để không
            chạy action chính. Feedback hover chỉ icon (scale), nền nút không đổi. */}
        <span
          data-chevron
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className={`ml-1.5 flex -mr-1.5 cursor-pointer items-center self-stretch py-1 pl-1.5${open ? ' bg-black/5' : ''}`}
        >
          <Icon name="chevron-down" size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
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
