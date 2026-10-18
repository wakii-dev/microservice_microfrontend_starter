// SplitButton — MỘT nút duy nhất [label ⌄]: icon chevron nằm TRONG nút (trailing icon),
// không chia 2 phần thị giác — chỉ vùng click khác nhau (label = action, chevron = menu).
// Unity shell 2026-10-18 (feedback user: 2 component Button rời → lộ seam, không
// "1 thể thống nhất"): KHÔNG còn dùng Button — 2 <button> trần trong 1 wrapper
// liên tục: MỘT border duy nhất trên wrapper (primary: border-accent · danger
// solid: border-st-fail · default: border-line · text: transparent), rounded-lg +
// overflow-hidden; focus ring (has-[:focus-visible]) + hover lift/shadow + active
// scale đặt trên WRAPPER; vạch phân cách nội bộ = span w-px cùng tông (solid:
// white/20, default/text: line) — không gap, không double-border. Hover từng phần:
// main accent-hi (solid) / bg-s3 (default), chevron overlay color-mix 10–15% cùng
// tông → nền luôn liền mạch. Behavior batch ⑱ GIỮ NGUYÊN: useClickAway + ESC
// (useKeyPress) + ArrowDown focus-first + a11y role menu/menuitem + aria-haspopup/
// aria-expanded + motion bp-zoom-in (--motion-fast) + z --z-dropdown.
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

/** Height/padding đồng bộ Button (middle mặc định h-9) — chevron hẹp hơn main. */
const SIZE: Record<ButtonSize, { main: string; chevron: string }> = {
  small: { main: 'h-8 px-3 text-label', chevron: 'h-8 px-1.5' },
  middle: { main: 'h-9 px-4 text-body', chevron: 'h-9 px-1.5' },
  large: { main: 'h-10 px-5 text-body', chevron: 'h-10 px-2' },
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

  // ESC đóng menu — handler qua ref, chỉ hiệu lực khi open (setState no-op khi đóng).
  useKeyPress('Escape', () => setOpen(false));

  // Mở bằng keyboard (ArrowDown) → focus item đầu tiên.
  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.focus();
      focusFirstOnOpen.current = false;
    }
  }, [open]);

  // Tông visual theo type/danger (map cũ: danger chỉ đổi tông khi primary/text).
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
  // Chevron hover = overlay color-mix CÙNG tông (không replace nền → khối liên tục):
  // solid trộn trắng 15% vào màu nền; default trộn ink 10% vào s2 (đen/trắng theo theme).
  const chevronCls = solid
    ? danger
      ? 'bg-st-fail text-white hover:bg-[color-mix(in_srgb,white_15%,var(--st-fail))]'
      : 'bg-accent text-white hover:bg-[color-mix(in_srgb,white_15%,var(--accent))]'
    : type === 'text'
      ? danger
        ? 'bg-transparent text-st-fail hover:bg-st-fail/12'
        : 'bg-transparent text-ink hover:bg-s3'
      : 'bg-s2 text-ink hover:bg-[color-mix(in_srgb,var(--ink)_10%,var(--c-s2))]';
  // Divider tinh tế như primary: default dùng ink/10 (mảnh, cùng tông) — KHÔNG dùng bg-line (đậm → lộ cấu trúc 2 phần)

  return (
    <span ref={containerRef} className={`relative inline-flex${className ? ` ${className}` : ''}`}>
      <span
        className={`inline-flex overflow-hidden rounded-lg border ${shellBorder} transition-all duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-lift)] active:scale-[0.98] focus-visible:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas`}
      >
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex cursor-pointer items-center justify-center gap-1 border-0 font-medium tracking-[0.01em] outline-none transition-colors duration-150 ${SIZE[size].main} ${mainCls}`}
        >
          {label}
        </button>
        <button
          type="button"
          aria-label="Thêm tuỳ chọn"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              focusFirstOnOpen.current = true;
              setOpen(true);
            }
          }}
          className={`inline-flex cursor-pointer items-center justify-center border-0 outline-none transition-colors duration-150 ${SIZE[size].chevron} ${chevronCls}`}
        >
          <span aria-hidden="true" className={`inline-flex transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <Icon name="chevron-down" size={14} />
          </span>
        </button>
      </span>
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
