// Menubar — horizontal menu bar (hover dropdown).
import { useState, type ReactNode } from 'react';

export interface MenubarItem {
  key: string;
  label: ReactNode;
  children?: Array<{ key: string; label: string; danger?: boolean }>;
  onClick?: () => void;
}

export interface MenubarProps { items: MenubarItem[]; className?: string }

export function Menubar({ items, className }: MenubarProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <nav className={`flex items-center gap-1 border-b border-line bg-s1 px-4 py-1.5${className ? ` ${className}` : ''}`}>
      {items.map((item) => (
        <div key={item.key} className="relative"
          onMouseEnter={() => item.children && setOpenKey(item.key)}
          onMouseLeave={() => item.children && setOpenKey(null)}>
          <button type="button" onClick={item.onClick}
            className={`cursor-pointer rounded-2 border-none bg-transparent px-3 py-1.5 text-body transition-colors ${openKey === item.key ? 'text-accent' : 'text-ink hover:text-accent'}`}>
            {item.label}
          </button>
          {item.children && openKey === item.key && (
            <ul className="absolute left-0 top-full z-30 m-0 min-w-[160px] list-none rounded-3 border border-line bg-s2 p-1 shadow-[var(--shadow-pop)]">
              {item.children.map((sub) => (
                <li key={sub.key}>
                  <button type="button"
                    className={`w-full cursor-pointer rounded-2 border-none bg-transparent px-3 py-1.5 text-left text-body transition-colors ${sub.danger ? 'text-st-fail hover:bg-st-fail/12' : 'text-ink hover:bg-s3'}`}
                    onClick={() => setOpenKey(null)}>
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
