// TabMenu — tab-style navigation (links + buttons).
// slots-wave: classNames root/item + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface TabMenuItem { key: string; label: ReactNode; href?: string }

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface TabMenuClassNames {
  /** <nav> thanh tab. */
  root?: string;
  /** <a>/<button> mỗi tab (áp cả active). */
  item?: string;
}

export interface TabMenuProps {
  model: TabMenuItem[];
  activeKey?: string;
  onTabChange?: (key: string) => void;
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: TabMenuClassNames;
}

export function TabMenu(props: TabMenuProps) {
  const { model, activeKey, onTabChange, className, style } = props;
  const slots = props.classNames;
  return (
    <nav className={classNames('flex gap-1 border-b border-line2', slots?.root, className)} style={style}>
      {model.map((item) => {
        const isActive = item.key === activeKey;
        if (item.href) {
          return <a key={item.key} href={item.href} aria-current={isActive ? 'page' : undefined}
            className={classNames('px-4 py-2.5 text-body no-underline transition-colors', isActive ? 'border-b-2 border-accent font-semibold text-accent' : 'border-b-2 border-transparent text-ink2 hover:text-accent', slots?.item)}>
            {item.label}
          </a>;
        }
        return (
          <button key={item.key} type="button" aria-current={isActive ? 'page' : undefined} onClick={() => onTabChange?.(item.key)}
            className={classNames('cursor-pointer border-none bg-transparent px-4 py-2.5 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40', isActive ? 'border-b-2 border-accent font-semibold text-accent' : 'border-b-2 border-transparent text-ink2 hover:text-accent', slots?.item)}>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
