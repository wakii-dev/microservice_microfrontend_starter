// Sidebar — brand slot + children + footer slot; collapsible 200px → 80px
// icon-only. Ngôn ngữ design-system: bg-s2 + border-line, trigger viền pill
// tại mép phải. Motion CSS thuần: transition width + label fade (opacity/width).
// Menu trong children tự icon-only qua MenuCompactContext (sidebar → menu,
// đúng chiều layering). a11y: role=complementary + aria-label + aria-expanded.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { MenuCompactContext } from '../menu/index.js';

export interface SidebarProps {
  /** Slot đầu — logo/brand (giữ nguyên khi collapse, consumer tự icon-only). */
  brand?: ReactNode;
  /** Nội dung chính — thường là Menu (label tự fade khi collapse). */
  children?: ReactNode;
  /** Slot cuối — user chip/actions. */
  footer?: ReactNode;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  ariaLabel?: string;
  className?: string;
}

function ChevronLeftIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronRightIcon() {
  return <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function Sidebar({
  brand,
  children,
  footer,
  defaultCollapsed = false,
  onToggle,
  ariaLabel = 'Sidebar',
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      onToggle?.(next);
      return next;
    });

  return (
    <aside
      role="complementary"
      aria-label={ariaLabel}
      data-collapsed={collapsed}
      className={`relative flex h-full flex-col border-r border-line bg-s2 transition-[width] duration-200 ease-out ${
        collapsed ? 'w-20' : 'w-[200px]'
      }${className ? ` ${className}` : ''}`}
    >
      {brand && (
        <div className="flex h-14 shrink-0 items-center overflow-hidden border-b border-line px-4">
          {brand}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <MenuCompactContext.Provider value={collapsed}>{children}</MenuCompactContext.Provider>
      </div>
      {footer && <div className="shrink-0 border-t border-line p-2">{footer}</div>}
      <button
        type="button"
        aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
        aria-expanded={!collapsed}
        onClick={toggle}
        className="absolute -right-3 top-1/2 z-10 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill border border-line bg-s1 text-ink2 transition-colors hover:text-accent"
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
    </aside>
  );
}
