// SpeedDial — FAB + radiating actions (antd lite).
import { useState, type ReactNode } from 'react';

export interface SpeedDialAction { key: string; icon: ReactNode; label: string; onClick?: () => void }

export interface SpeedDialProps {
  /** FAB icon. */
  icon: ReactNode;
  actions: SpeedDialAction[];
  className?: string;
}

export function SpeedDial({ icon, actions, className }: SpeedDialProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`fixed bottom-6 right-6 z-[var(--z-toast)] flex flex-col items-center gap-2${className ? ` ${className}` : ''}`}>
      {open && actions.map((action, i) => (
        <button key={action.key} type="button" aria-label={action.label}
          onClick={() => { action.onClick?.(); setOpen(false); }}
          className="grid size-9 cursor-pointer place-items-center rounded-pill border border-line bg-s2 text-body text-ink2 shadow-[var(--shadow-lift)] transition-all duration-[240ms] ease-[var(--ease-smooth)] hover:text-accent hover:bg-s3 hover:shadow-[var(--ele-2)] active:translate-y-px"
          style={{ animation: `bp-slide-up-in 150ms cubic-bezier(0.16,1,0.3,1) ${(actions.length - 1 - i) * 40}ms both` }}>
          {action.icon}
        </button>
      ))}
      <button type="button" aria-label="Thao tác" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`grid size-12 cursor-pointer place-items-center rounded-pill border-none bg-accent text-xl text-white shadow-[var(--ele-3),var(--shadow-pop)] transition-transform duration-[240ms] ease-[var(--ease-smooth)] ${open ? 'rotate-45' : ''}`}>
        {icon}
      </button>
    </div>
  );
}
