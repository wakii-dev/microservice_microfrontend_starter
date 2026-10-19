// Fieldset — panel có legend (PrimeReact lite): viền + legend lợn trên viền,
// toggleable gập/mở bằng grid-rows 0fr↔1fr (3 lớp: grid wrapper → overflow-hidden → content).
import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface FieldsetProps {
  /** Tiêu đề panel — text hoặc ReactNode. */
  legend?: ReactNode;
  /** Cho phép bấm legend để gập/mở. */
  toggleable?: boolean;
  /** Controlled gập; không truyền → uncontrolled (defaultCollapsed). */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  /** Báo trạng thái gập khi toggle. */
  onToggle?: (collapsed: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export function Fieldset({ legend, toggleable = false, collapsed, defaultCollapsed = false, onToggle, children, className }: FieldsetProps) {
  const [inner, setInner] = useState(defaultCollapsed);
  const isCollapsed = collapsed ?? inner;
  const contentId = useId();

  function toggle() {
    if (!toggleable) return;
    const next = !isCollapsed;
    if (collapsed === undefined) setInner(next);
    onToggle?.(next);
  }

  const header = (
    <span
      className={`absolute -top-2.5 left-3 flex items-center gap-1 bg-canvas px-2 text-label font-medium text-ink2${
        toggleable ? ' cursor-pointer select-none' : ''
      }`}
      onClick={toggle}
      aria-expanded={toggleable ? !isCollapsed : undefined}
      aria-controls={toggleable ? contentId : undefined}
      role={toggleable ? 'button' : undefined}
      tabIndex={toggleable ? 0 : undefined}
      onKeyDown={toggleable ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle()) : undefined}
    >
      {toggleable && (
        <Icon name="chevron-down" size={12} className={`text-ink3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} aria-hidden={true} />
      )}
      {legend}
    </span>
  );

  return (
    <fieldset className={`relative rounded-xl border border-line bg-s1 p-0 m-0${className ? ` ${className}` : ''}`}>
      {header}
      {/* 3-tier clip: grid rows 0fr↔1fr → overflow-hidden → content padding */}
      <div id={contentId} className="grid transition-[grid-template-rows] duration-200 ease-[var(--ease-enter)]" style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }} aria-hidden={isCollapsed || undefined}>
        <div className="overflow-hidden min-h-0">
          <div className="p-4 text-body text-ink">{children}</div>
        </div>
      </div>
    </fieldset>
  );
}
