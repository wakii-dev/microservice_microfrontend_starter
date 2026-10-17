import { useState, type ReactNode } from 'react';
// Collapse — các panel gập/mở (antd lite): items key/label/children; nhiều panel
// mở cùng lúc (Set keys); chevron xoay; border-b phân cách.

export interface CollapseItem {
  key: string;
  label: ReactNode;
  children: ReactNode;
}

export interface CollapseProps {
  items: CollapseItem[];
  /** Keys mở mặc định (uncontrolled). */
  defaultActiveKeys?: string[];
  className?: string;
}

export function Collapse({ items, defaultActiveKeys = [], className }: CollapseProps) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set(defaultActiveKeys));

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className={`overflow-hidden rounded-3 border border-line bg-s2${className ? ` ${className}` : ''}`}>
      {items.map((item, i) => {
        const open = openKeys.has(item.key);
        return (
          <div key={item.key} className={i > 0 ? 'border-t border-line2' : ''}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(item.key)}
              className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3 text-left text-body font-medium text-ink"
            >
              {item.label}
              <span aria-hidden="true" className={`text-ink3 transition-transform ${open ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>
            {open && <div className="px-4 pb-3 text-body text-ink2">{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
}
