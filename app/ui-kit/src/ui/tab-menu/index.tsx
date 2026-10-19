// TabMenu — tab-style navigation (links + buttons).
import type { ReactNode } from 'react';

export interface TabMenuItem { key: string; label: ReactNode; href?: string }

export interface TabMenuProps {
  model: TabMenuItem[];
  activeKey?: string;
  onTabChange?: (key: string) => void;
  className?: string;
}

export function TabMenu({ model, activeKey, onTabChange, className }: TabMenuProps) {
  return (
    <nav className={`flex gap-1 border-b border-line2${className ? ` ${className}` : ''}`}>
      {model.map((item) => {
        const isActive = item.key === activeKey;
        if (item.href) {
          return <a key={item.key} href={item.href} aria-current={isActive ? 'page' : undefined}
            className={`px-4 py-2.5 text-body no-underline transition-colors duration-[240ms] ease-[var(--ease-smooth)] ${isActive ? 'border-b-2 border-accent font-semibold text-accent' : 'border-b-2 border-transparent text-ink2 hover:text-accent'}`}>
            {item.label}
          </a>;
        }
        return (
          <button key={item.key} type="button" aria-current={isActive ? 'page' : undefined} onClick={() => onTabChange?.(item.key)}
            className={`cursor-pointer border-none bg-transparent px-4 py-2.5 text-body transition-colors duration-[240ms] ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${isActive ? 'border-b-2 border-accent font-semibold text-accent' : 'border-b-2 border-transparent text-ink2 hover:text-accent'}`}>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
