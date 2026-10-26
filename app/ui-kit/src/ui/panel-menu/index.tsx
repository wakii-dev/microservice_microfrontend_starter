// PanelMenu — vertical accordion menu.
// slots-wave: classNames root/item/header/submenu/subList/subItem + style.
import classNames from 'classnames';
import { useState, type CSSProperties, type ReactNode } from 'react';

export interface PanelMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: Array<{ key: string; label: string }>;
  onClick?: () => void;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface PanelMenuClassNames {
  /** <nav> gốc bọc các nhóm. */
  root?: string;
  /** Div 1 nhóm (header + submenu). */
  item?: string;
  /** Button header nhóm (toggle accordion). */
  header?: string;
  /** Div bọc submenu (grid-rows animate). */
  submenu?: string;
  /** <ul> danh sách con. */
  subList?: string;
  /** Button item con. */
  subItem?: string;
}

export interface PanelMenuProps {
  items: PanelMenuItem[];
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: PanelMenuClassNames;
}

export function PanelMenu(props: PanelMenuProps) {
  const { items, className, style } = props;
  const slots = props.classNames;
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  function toggle(k: string) {
    setOpenKeys((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }
  return (
    <nav className={classNames('overflow-hidden rounded-xl border border-line bg-s2', slots?.root, className)} style={style}>
      {items.map((item) => (
        <div key={item.key} className={slots?.item}>
          <button type="button"
            onClick={() => item.children ? toggle(item.key) : item.onClick?.()}
            className={classNames('flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-2.5 text-left text-body font-medium text-ink hover:bg-s3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40', slots?.header)}>
            {item.icon}
            {item.label}
            {item.children && <span className={`ml-auto text-[10px] text-ink3 transition-transform ${openKeys.has(item.key) ? 'rotate-180' : ''}`}>▾</span>}
          </button>
          {item.children && (
            <div
              className={classNames('grid min-h-0 overflow-hidden transition-[grid-template-rows] duration-200 ease-[var(--ease-enter)]',
                openKeys.has(item.key) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]', slots?.submenu)}
              aria-hidden={!openKeys.has(item.key) || undefined}
              inert={!openKeys.has(item.key)}
            >
              <ul className={classNames('m-0 min-h-0 list-none overflow-hidden p-0', slots?.subList)}>
                {item.children.map((sub) => (
                  <li key={sub.key}>
                    <button type="button"
                      className={classNames('w-full cursor-pointer border-none bg-transparent py-2 pl-10 pr-4 text-left text-body text-ink2 hover:text-accent', slots?.subItem)}>
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
