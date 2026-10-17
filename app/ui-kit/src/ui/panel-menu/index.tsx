// PanelMenu — vertical accordion menu.
import { useState, type ReactNode } from 'react';

export interface PanelMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: Array<{ key: string; label: string }>;
  onClick?: () => void;
}

export interface PanelMenuProps { items: PanelMenuItem[]; className?: string }

export function PanelMenu({ items, className }: PanelMenuProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  function toggle(k: string) {
    setOpenKeys((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }
  return (
    <nav className={`overflow-hidden rounded-3 border border-line bg-s2${className ? ` ${className}` : ''}`}>
      {items.map((item) => (
        <div key={item.key}>
          <button type="button"
            onClick={() => item.children ? toggle(item.key) : item.onClick?.()}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-4 py-2.5 text-left text-body font-medium text-ink hover:bg-s3">
            {item.icon}
            {item.label}
            {item.children && <span className={`ml-auto text-[10px] text-ink3 transition-transform ${openKeys.has(item.key) ? 'rotate-180' : ''}`}>▾</span>}
          </button>
          {item.children && openKeys.has(item.key) && (
            <ul className="m-0 list-none p-0">
              {item.children.map((sub) => (
                <li key={sub.key}>
                  <button type="button"
                    className="w-full cursor-pointer border-none bg-transparent py-2 pl-10 pr-4 text-left text-body text-ink2 hover:text-accent">
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
