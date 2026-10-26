// Menubar — horizontal menu bar (hover dropdown).
// slots-wave: classNames root/item/itemButton/submenu/subItem + style passthrough.
import classNames from 'classnames';
import { useState, type CSSProperties, type ReactNode } from 'react';

export interface MenubarItem {
  key: string;
  label: ReactNode;
  children?: Array<{ key: string; label: string; danger?: boolean; onClick?: () => void }>;
  onClick?: () => void;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface MenubarClassNames {
  /** <nav> thanh menu ngang. */
  root?: string;
  /** Div relative bọc 1 item (trigger + dropdown). */
  item?: string;
  /** Button trigger cấp 1. */
  itemButton?: string;
  /** <ul> dropdown con. */
  submenu?: string;
  /** Button item con trong dropdown. */
  subItem?: string;
}

export interface MenubarProps {
  items: MenubarItem[];
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: MenubarClassNames;
}

export function Menubar(props: MenubarProps) {
  const { items, className, style } = props;
  const slots = props.classNames;
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <nav
      className={classNames(
        'flex items-center gap-1 border-b border-line bg-s1 px-4 py-1.5',
        slots?.root,
        className,
      )}
      style={style}
    >
      {items.map((item) => (
        <div key={item.key} className={classNames('relative', slots?.item)}
          onMouseEnter={() => item.children && setOpenKey(item.key)}
          onMouseLeave={() => item.children && setOpenKey(null)}>
          <button type="button" onClick={item.onClick}
            className={classNames('cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-body transition-colors', openKey === item.key ? 'text-accent' : 'text-ink hover:text-accent', slots?.itemButton)}>
            {item.label}
          </button>
          {item.children && openKey === item.key && (
            <ul className={classNames('absolute left-0 top-full z-[var(--z-dropdown)] m-0 min-w-[160px] origin-top-left list-none rounded-xl border border-line bg-s2 p-1 shadow-[var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)]', slots?.submenu)}>
              {item.children.map((sub) => (
                <li key={sub.key}>
                  <button type="button"
                    className={classNames('w-full cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40', sub.danger ? 'text-st-fail hover:bg-st-fail/12' : 'text-ink hover:bg-s3', slots?.subItem)}
                    onClick={() => { sub.onClick?.(); setOpenKey(null); }}>
                    {sub.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
