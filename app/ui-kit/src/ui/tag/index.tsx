// Tag — nhãn + CheckableTag (filter chips). Checkable giữ <button aria-pressed> —
// a11y TỐT HƠN antd (span + onClick không có semantic). Checked = nền accent solid
// (antd CheckableTag checked); unchecked = viền line, chữ ink3 (mirror tsk-chip cũ).
import type { ReactNode } from 'react';

export interface TagProps {
  children: ReactNode;
  className?: string;
}

export interface CheckableTagProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
}

function TagBase({ children, className }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-2 border border-line bg-s3 px-2 py-0.5 text-meta text-ink2${className ? ` ${className}` : ''}`}
    >
      {children}
    </span>
  );
}

function Checkable({ checked, onChange, children, className }: CheckableTagProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex cursor-pointer items-center rounded-pill border px-3 py-1 text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
        checked
          ? 'border-accent bg-accent text-white hover:border-accent-hi hover:bg-accent-hi'
          : 'border-line bg-transparent text-ink3 hover:border-line2 hover:text-ink2'
      }${className ? ` ${className}` : ''}`}
    >
      {children}
    </button>
  );
}

/** Tag + Tag.Checkable — composite component pattern antd (Tag.CheckableTag). */
export const Tag = Object.assign(TagBase, { Checkable });
