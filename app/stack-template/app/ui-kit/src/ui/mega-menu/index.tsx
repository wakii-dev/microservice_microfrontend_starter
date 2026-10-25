// MegaMenu — horizontal bar + panel dropdown multi-column (PrimeReact MegaMenu
// kiểu). Item root: { key, label, icon?, children } — children là các GROUP
// (2 cấp: group = 1 cột trong panel → leaf items); root không children = item lá
// (onClick trực tiếp). Mở: hover HOẶC click; đóng: mouseLeave / ESC (trả focus
// về trigger) / click ngoài / click leaf. Panel = CSS grid nhiều cột (grid-
// template-columns inline theo số group — không cần đo đạc). A11y: panel
// role=menu + leaf role=menuitem, trigger aria-haspopup + aria-expanded; leaf
// danger = đỏ; icon qua bộ Icon (KHÔNG tự vẽ glyph).
import { useEffect, useState, type ReactNode } from 'react';
import { useClickAway } from '../../hooks/useClickAway.js';

export interface MegaMenuLeaf {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

/** 1 cột trong panel — group label + các leaf item. */
export interface MegaMenuGroup {
  key: string;
  label: string;
  items: MegaMenuLeaf[];
}

export interface MegaMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Các group — mỗi group render 1 cột trong panel dropdown. */
  children?: MegaMenuGroup[];
  onClick?: () => void;
}

export interface MegaMenuProps {
  items: MegaMenuItem[];
  className?: string;
}

export function MegaMenu({ items, className }: MegaMenuProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  // useClickAway trả ref gắn lên nav — vừa dò click ngoài vừa làm root dò trigger.
  const rootRef = useClickAway<HTMLElement>(() => setOpenKey(null));

  // ESC đóng + trả focus về trigger đang mở; click ngoài đóng.
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenKey(null);
        rootRef.current
          ?.querySelector<HTMLButtonElement>(`button[data-mega-trigger="${openKey}"]`)
          ?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openKey, rootRef]);

  return (
    <nav
      ref={rootRef}
      className={`flex items-center gap-1 border-b border-line bg-s1 px-4 py-1.5${className ? ` ${className}` : ''}`}
    >
      {items.map((item) => {
        const open = openKey === item.key;
        return (
          <div
            key={item.key}
            className="relative"
            onMouseEnter={() => item.children && setOpenKey(item.key)}
            onMouseLeave={(e) => {
              // Guard relatedTarget: qua lại trigger↔panel (DOM con của wrapper)
              // không tính là rời menu — chỉ đóng khi target mới là Node NGOÀI
              // wrapper (relatedTarget null/khác Node = rời hẳn cửa sổ → đóng).
              const rt = e.relatedTarget;
              if (item.children && !(rt instanceof Node && e.currentTarget.contains(rt))) setOpenKey(null);
            }}
          >
            <button
              type="button"
              data-mega-trigger={item.key}
              aria-haspopup={item.children ? 'menu' : undefined}
              aria-expanded={item.children ? open : undefined}
              onClick={() => {
                if (!item.children) {
                  item.onClick?.();
                  return;
                }
                // Click CHỈ MỞ (hover trên desktop đã mở sẵn — toggle tại đây sẽ
                // đóng ngay do chuỗi hover→click của cùng cú click). Đóng nhường
                // mouseLeave / ESC / click-ngoài / click leaf.
                setOpenKey(item.key);
              }}
              className={`cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                open ? 'text-accent' : 'text-ink hover:text-accent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
            {open && item.children && (
              <div
                role="menu"
                aria-label={typeof item.label === 'string' ? item.label : undefined}
                className="absolute left-0 top-full z-[var(--z-dropdown)] m-0 grid origin-top-left gap-6 rounded-xl border border-line bg-s2 p-4 shadow-[var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]"
                style={{ gridTemplateColumns: `repeat(${item.children.length}, minmax(10rem, 1fr))` }}
              >
                {item.children.map((group) => (
                  <div key={group.key} className="min-w-0">
                    <div className="mb-1 text-label font-semibold text-ink3">{group.label}</div>
                    <ul className="m-0 list-none p-0">
                      {group.items.map((leaf) => (
                        <li key={leaf.key}>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              leaf.onClick?.();
                              setOpenKey(null);
                            }}
                            className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-2 py-1.5 text-left text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 hover:bg-s3 ${
                              leaf.danger ? 'text-st-fail' : 'text-ink'
                            }`}
                          >
                            {leaf.icon}
                            {leaf.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
