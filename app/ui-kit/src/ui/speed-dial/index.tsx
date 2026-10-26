// SpeedDial — FAB + radiating actions (antd lite).
// Customize pass (slots wave 3): classNames slots (root/action/trigger) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI.
import classNames from 'classnames';
import { useState, type CSSProperties, type ReactNode } from 'react';

export interface SpeedDialAction { key: string; icon: ReactNode; label: string; onClick?: () => void }

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface SpeedDialClassNames {
  /** Div gốc fixed góc màn (bọc actions + FAB). */
  root?: string;
  /** Nút action radiate khi mở. */
  action?: string;
  /** Nút FAB tròn lớn. */
  trigger?: string;
}

export interface SpeedDialProps {
  /** FAB icon. */
  icon: ReactNode;
  actions: SpeedDialAction[];
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: SpeedDialClassNames;
}

export function SpeedDial(props: SpeedDialProps) {
  const { icon, actions, className, style } = props;
  const slots = props.classNames;
  const [open, setOpen] = useState(false);
  return (
    <div
      className={classNames('fixed bottom-6 right-6 z-[var(--z-toast)] flex flex-col items-center gap-2', slots?.root, className)}
      style={style}
    >
      {open && actions.map((action, i) => (
        <button key={action.key} type="button" aria-label={action.label}
          onClick={() => { action.onClick?.(); setOpen(false); }}
          className={classNames(
            'grid size-9 cursor-pointer place-items-center rounded-pill border border-line bg-s2 text-body text-ink2 shadow-[var(--shadow-lift)] transition-all hover:text-accent',
            slots?.action,
          )}
          style={{ animation: `bp-slide-up-in 150ms cubic-bezier(0.16,1,0.3,1) ${(actions.length - 1 - i) * 40}ms both` }}>
          {action.icon}
        </button>
      ))}
      <button type="button" aria-label="Thao tác" aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={classNames(
          'grid size-12 cursor-pointer place-items-center rounded-pill border-none bg-accent text-xl text-white shadow-[var(--shadow-pop)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          open ? 'rotate-45' : '',
          slots?.trigger,
        )}>
        {icon}
      </button>
    </div>
  );
}
