// Tabs — type line (antd): tab bar border-b line2, item active chữ accent + gạch
// accent 2px, item padding 12px 0 + gap 32; content render children tab active.
import type { ReactNode } from 'react';

export interface TabItem {
  key: string;
  label: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className }: TabsProps) {
  const current = activeKey ?? items[0]?.key;
  const active = items.find((t) => t.key === current);

  return (
    <div className={className}>
      <div role="tablist" className="m-0 flex list-none gap-8 border-b border-line2 p-0">
        {items.map((tab) => {
          const isActive = tab.key === current;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange?.(tab.key)}
              className={`relative cursor-pointer border-none bg-transparent px-0 py-3 text-body transition-colors after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:content-[''] ${
                isActive
                  ? 'text-accent after:bg-accent'
                  : 'text-ink after:bg-transparent hover:text-accent'
              } ${tab.disabled ? 'cursor-not-allowed text-ink3' : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-4">
        {active?.children}
      </div>
    </div>
  );
}
